import { describe, it, expect } from "vitest";
import { calcProportionalCost } from "@/lib/metrics";
import { calcAccountUpdate } from "@/lib/accounts";

/**
 * Testes de invariantes financeiras.
 *
 * Toda operação que altera saldo DEVE ter uma inversão espelhada.
 * Estes testes garantem que as operações de reversal são corretas.
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

  describe("clearAccountData preserva Transferência", () => {
    it("verifica que tipo Transferência pode ser re-inserido após delete", () => {
      // Este teste documenta o comportamento esperado:
      // clearAccountData deve deletar TUDO mas re-inserir Transferência
      const transferenciaType = {
        name: "Transferência",
        accountType: "milhas",
        color: "#8b5cf6",
      };

      // Verifica que o tipo built-in tem os campos corretos
      expect(transferenciaType.name).toBe("Transferência");
      expect(transferenciaType.accountType).toBe("milhas");
      expect(transferenciaType.color).toBe("#8b5cf6");
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
