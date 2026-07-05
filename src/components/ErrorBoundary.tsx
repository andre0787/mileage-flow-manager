import { Component, type ReactNode, type ErrorInfo } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  error: Error | null
  errorInfo: ErrorInfo | null
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    this.setState({ errorInfo });
    console.error("[ErrorBoundary]", error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ error: null, errorInfo: null });
  };

  render() {
    if (this.state.error) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex flex-col items-center justify-center min-h-[400px] p-8 space-y-4 animate-appear">
          <div className="h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center">
            <AlertTriangle className="h-8 w-8 text-destructive" />
          </div>
          <div className="text-center space-y-2 max-w-md">
            <h2 className="text-xl font-semibold text-foreground font-display">
              Algo deu errado
            </h2>
            <p className="text-sm text-muted-foreground">
              Ocorreu um erro inesperado ao carregar esta seção.
              Tente recarregar a página ou clique no botão abaixo.
            </p>
            {process.env.NODE_ENV === "development" && this.state.error && (
              <details className="text-left mt-4">
                <summary className="text-xs text-muted-foreground cursor-pointer">
                  Detalhes do erro (dev)
                </summary>
                <pre className="mt-2 p-3 rounded-lg bg-muted text-xs text-destructive overflow-auto max-h-40">
                  {this.state.error.message}
                  {this.state.errorInfo?.componentStack}
                </pre>
              </details>
            )}
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              className="gap-2"
              onClick={() => window.location.reload()}
            >
              <RefreshCw className="h-4 w-4" />
              Recarregar Página
            </Button>
            <Button
              className="gap-2 bg-gradient-primary hover:opacity-90"
              onClick={this.handleRetry}
            >
              Tentar Novamente
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
