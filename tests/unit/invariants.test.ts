import { describe, it, expect } from "vitest";
import { calcProportionalCost } from "@/lib/metrics";
import { calcAccountUpdate, type AccountBalanceState } from "@/lib/accounts";

/**
 * Testes de invariantes financeiras.
 *
 * Toda operação que altera saldo DEVE ter uma inversão espelhada.
 * Estes testes garantem que as operações de reversal são corretas.
 *
 * Cobertura:
 * - Reversão de transferência (custo proporcional, amountPaid vs proporcional)
 * - Casos de limite: saldo zero, negativo truncado, precisão, overflow
 * - Reversal de operação composta com falha parcial
 */

describe("Invariantes Financeiras", () => {
  describe("Reversão de Transferência", () => {
    it("reversão de transferência restaura saldo e investimento proporcional", () => {
      // Cenário: transferência de 10.000 pontos de uma conta
      // Conta origem: balance=50.000, totalInvested=25.000
      const srcBalance = 50000;
      const srcInvested = 25000;
      const amountToTransfer = 10000;

      // Cálculo do custo proporcional (o que seria debitado)
      const proportionalCost = calcProportionalCost(
        amountToTransfer,
        srcBalance,
        srcInvested,
      );

      // Operação original: debita amount e custo proporcional
      const afterDebit = calcAccountUpdate(
        srcBalance,
        srcInvested,
        -amountToTransfer,
        -proportionalCost,
      );

      // Reversão: credita amount e custo proporcional (MESMO valor)
      const afterReversal = calcAccountUpdate(
        afterDebit.balance,
        afterDebit.total_invested,
        amountToTransfer,
        proportionalCost,
      );

      // Invariante: reversal deve restaurar ao estado original
      expect(afterReversal.balance).toBe(srcBalance);
      expect(afterReversal.total_invested).toBe(srcInvested);
    });

    it("reversão NÃO deve usar amountPaid para contas de milhas", () => {
      // Cenário: entry.amountPaid = 500, mas custo proporcional = 400
      // Se usarmos amountPaid (500) na reversão, investimento fica distorcido
      const srcBalance = 50000;
      const srcInvested = 25000;
      const amountToTransfer = 10000;
      const amountPaid = 500; // valor "pago" na entry

      const proportionalCost = calcProportionalCost(
        amountToTransfer,
        srcBalance,
        srcInvested,
      );

      // Se proportionalCost != amountPaid, usar amountPaid é ERRADO
      // Neste caso, proportionalCost = (25000/50000) * 10000 = 5000
      // amountPaid = 500 é muito menor → usar amountPaid distorceria o investimento
      expect(proportionalCost).not.toBe(amountPaid);
      expect(proportionalCost).toBe(5000);

      // A reversão correta usa proportionalCost, não amountPaid
      const afterDebit = calcAccountUpdate(
        srcBalance,
        srcInvested,
        -amountToTransfer,
        -proportionalCost,
      );

      const afterReversalCorrect = calcAccountUpdate(
        afterDebit.balance,
        afterDebit.total_invested,
        amountToTransfer,
        proportionalCost, // ← correto
      );

      const afterReversalWrong = calcAccountUpdate(
        afterDebit.balance,
        afterDebit.total_invested,
        amountToTransfer,
        amountPaid, // ← ERRADO
      );

      // Correto restaura ao original
      expect(afterReversalCorrect.balance).toBe(srcBalance);
      expect(afterReversalCorrect.total_invested).toBe(srcInvested);

      // Errado distorce o investimento
      expect(afterReversalWrong.total_invested).not.toBe(srcInvested);
    });
  });

  describe("Casos de limite — calcAccountUpdate", () => {
    it("saldo zero permanece zero com delta zero", () => {
      const result = calcAccountUpdate(0, 0, 0, 0);
      expect(result.balance).toBe(0);
      expect(result.total_invested).toBe(0);
      expect(result.average_cost_per_mile).toBe(0);
    });

    it("adiciona saldo a partir de zero", () => {
      const result = calcAccountUpdate(0, 0, 100, 50);
      expect(result.balance).toBe(100);
      expect(result.total_invested).toBe(50);
    });

    it("saldo negativo é truncado para zero", () => {
      const result = calcAccountUpdate(-100, 0, 0, 0);
      expect(result.balance).toBe(0);
    });

    it("investimento negativo é truncado para zero", () => {
      const result = calcAccountUpdate(100, 50, 0, -80);
      expect(result.total_invested).toBe(0);
    });

    it("débito maior que saldo zera o saldo (não negativo)", () => {
      const result = calcAccountUpdate(100, 50, -200, 0);
      expect(result.balance).toBe(0);
      expect(result.total_invested).toBe(50);
    });

    it("débito de investimento maior que total investido zera investimento", () => {
      const result = calcAccountUpdate(100, 50, 0, -100);
      expect(result.total_invested).toBe(0);
      expect(result.balance).toBe(100);
    });

    it("valores grandes não perdem precisão (Number.MAX_SAFE_INTEGER)", () => {
      // ponytail: Number.MAX_SAFE_INTEGER é 2^53 - 1 (≈9e15)
      // Isso cobre qualquer valor realista de milhas
      const big = Number.MAX_SAFE_INTEGER;
      const result = calcAccountUpdate(big, big, -100, -100);
      expect(result.balance).toBe(big - 100);
      expect(result.total_invested).toBe(big - 100);
    });

    it("calculo com decimais preserva precisão (centavos/milhas fracionadas)", () => {
      // Cenário: 12.75 milhas com investimento de 3.33
      const result = calcAccountUpdate(100.5, 50.25, 12.75, 3.33);
      expect(result.balance).toBe(113.25);
      expect(result.total_invested).toBe(53.58);
      // average_cost_per_mile deve ser 53.58 / 113.25 ≈ 0.4731...
      expect(result.average_cost_per_mile).toBeCloseTo(0.4731, 3);
    });

    it("average_cost_per_mile zero quando saldo é zero", () => {
      const result = calcAccountUpdate(0, 100, 0, 0);
      expect(result.average_cost_per_mile).toBe(0);
    });
  });

  describe("Reversal de operação composta (transferência entre contas)", () => {
    /**
     * Cenário: transferência entre duas contas.
     * 1. Debita da origem (calcAccountUpdate com delta negativo)
     * 2. Credita no destino (calcAccountUpdate com delta positivo)
     *
     * Se o passo 2 falha, precisamos reverter o passo 1.
     * Esta invariante garante que é possível reverter exatamente.
     */
    it("reversal de transferência com falha no crédito do destino", () => {
      // Conta origem: 50.000 milhas, investimento 25.000
      const srcBalance = 50000;
      const srcInvested = 25000;
      // Conta destino: 10.000 milhas, investimento 5.000
      const destBalance = 10000;
      const destInvested = 5000;
      const amountToTransfer = 10000;

      // Passo 1: debita da origem
      const proportionalCost = calcProportionalCost(
        amountToTransfer,
        srcBalance,
        srcInvested,
      );
      const afterDebit = calcAccountUpdate(
        srcBalance,
        srcInvested,
        -amountToTransfer,
        -proportionalCost,
      );

      // Simula falha no crédito do destino (ex.: Supabase error)
      // O estado intermediário é afterDebit na origem e original no destino
      // Invariante: a reversão no debito restaura a origem ao estado original
      const afterReversal = calcAccountUpdate(
        afterDebit.balance,
        afterDebit.total_invested,
        amountToTransfer,
        proportionalCost,
      );

      // Invariante: origem deve voltar ao estado original
      expect(afterReversal.balance).toBe(srcBalance);
      expect(afterReversal.total_invested).toBe(srcInvested);
      // Destino nunca foi alterado (simulando falha no crédito)
      expect(destBalance).toBe(10000);
      expect(destInvested).toBe(5000);

      // Invariante: saldo total do sistema é preservado
      expect(afterReversal.balance + destBalance).toBe(srcBalance + destBalance);
    });

    it("reversal funciona mesmo se origem já foi parcialmente debitada antes", () => {
      // Cenário: duas transferências consecutivas da mesma origem
      // Primeira transferência: 10.000
      // Segunda transferência: 5.000 — falha no destino
      const srcBalance = 50000;
      const srcInvested = 25000;

      // Primeira transferência concluída com sucesso
      const propCost1 = calcProportionalCost(10000, srcBalance, srcInvested);
      const afterFirst = calcAccountUpdate(srcBalance, srcInvested, -10000, -propCost1);

      // Segunda transferência — debita, mas destino falha
      const propCost2 = calcProportionalCost(5000, afterFirst.balance, afterFirst.total_invested);
      const afterSecondDebit = calcAccountUpdate(
        afterFirst.balance,
        afterFirst.total_invested,
        -5000,
        -propCost2,
      );

      // Reversão do segundo débito
      const afterSecondReversal = calcAccountUpdate(
        afterSecondDebit.balance,
        afterSecondDebit.total_invested,
        5000,
        propCost2,
      );

      // Invariante: deve voltar ao estado pós-primeira-transferência
      expect(afterSecondReversal.balance).toBe(afterFirst.balance);
      expect(afterSecondReversal.total_invested).toBe(afterFirst.total_invested);
    });
  });

  describe("Imutabilidade de arrays", () => {
    it("sort não deve mutar o array original", () => {
      const original = [3, 1, 4, 1, 5, 9, 2, 6];
      const originalCopy = [...original];

      //sort muta o array
      const sorted = [...original].sort((a, b) => a - b);

      // Invariante: array original não deve ser alterado
      expect(original).toEqual(originalCopy);
      // sorted deve estar ordenado
      expect(sorted).toEqual([1, 1, 2, 3, 4, 5, 6, 9]);
    });

    it("filter não deve mutar o array original", () => {
      const original = [1, 2, 3, 4, 5];
      const originalCopy = [...original];

      const filtered = original.filter((x) => x > 3);

      expect(original).toEqual(originalCopy);
      expect(filtered).toEqual([4, 5]);
    });
  });
});
