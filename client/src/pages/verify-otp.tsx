import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Mail, ArrowLeft } from "lucide-react";

interface OTPState {
  email: string;
  username: string;
  firstName?: string;
  lastName?: string;
  password?: string; // Password from registration
}

export default function VerifyOTP() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [otpState, setOtpState] = useState<OTPState | null>(null);

  useEffect(() => {
    // Get OTP state from localStorage (set during registration)
    const savedState = localStorage.getItem('otpVerificationState');
    if (savedState) {
      try {
        const state = JSON.parse(savedState);
        setOtpState(state);
        // Pre-fill password if stored from registration
        if (state.password) {
          setPassword(state.password);
          setConfirmPassword(state.password);
        }
      } catch (error) {
        console.error('Failed to parse OTP state:', error);
        setLocation('/register');
      }
    } else {
      // Redirect to register if no OTP state
      setLocation('/register');
    }
  }, [setLocation]);

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!otpState) {
      toast({
        title: "Erro",
        description: "Estado de verificação não encontrado. Tente registrar novamente.",
        variant: "destructive",
      });
      return;
    }

    if (otp.length !== 6) {
      toast({
        title: "Código inválido",
        description: "O código deve ter exatamente 6 dígitos.",
        variant: "destructive",
      });
      return;
    }

    if (password.length < 6) {
      toast({
        title: "Senha inválida",
        description: "A senha deve ter pelo menos 6 caracteres.",
        variant: "destructive",
      });
      return;
    }

    if (password !== confirmPassword) {
      toast({
        title: "Senhas não coincidem",
        description: "A senha e confirmação devem ser iguais.",
        variant: "destructive",
      });
      return;
    }

    setIsVerifying(true);

    try {
      const response = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: otpState.email,
          token: otp,
          password: password,
          username: otpState.username,
          firstName: otpState.firstName,
          lastName: otpState.lastName,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Clear OTP state
        localStorage.removeItem('otpVerificationState');
        
        toast({
          title: "Sucesso!",
          description: data.message,
        });

        // Redirect to login or dashboard
        setLocation('/login');
      } else {
        toast({
          title: "Erro na verificação",
          description: data.message,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('OTP verification error:', error);
      toast({
        title: "Erro",
        description: "Erro interno. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const handleBackToRegister = () => {
    localStorage.removeItem('otpVerificationState');
    setLocation('/register');
  };

  const formatOTP = (value: string) => {
    // Remove non-digits and limit to 6 characters
    const digits = value.replace(/\D/g, '').slice(0, 6);
    
    // Add spaces for better readability: "123 456"
    return digits.replace(/(\d{3})(\d{1,3})/, '$1 $2');
  };

  const handleOTPChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatOTP(e.target.value);
    setOtp(formatted.replace(/\s/g, '')); // Store without spaces
  };

  if (!otpState) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-2">
          <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
            <Mail className="w-6 h-6 text-primary" />
          </div>
          <CardTitle>Verificar Email</CardTitle>
          <CardDescription>
            Enviamos um código de 6 dígitos para <br />
            <strong>{otpState.email}</strong>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleVerifyOTP} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="otp">Código de Verificação</Label>
              <Input
                id="otp"
                data-testid="input-otp"
                type="text"
                placeholder="123 456"
                value={formatOTP(otp)}
                onChange={handleOTPChange}
                className="text-center text-2xl tracking-widest"
                maxLength={7} // 6 digits + 1 space
                required
              />
              <p className="text-sm text-muted-foreground text-center">
                Digite o código de 6 dígitos
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                data-testid="input-password"
                type="password"
                placeholder="Escolha uma senha forte"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={6}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmar Senha</Label>
              <Input
                id="confirmPassword"
                data-testid="input-confirm-password"
                type="password"
                placeholder="Confirme sua senha"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                minLength={6}
                required
              />
            </div>

            <Button 
              type="submit" 
              className="w-full" 
              disabled={isVerifying}
              data-testid="button-verify"
            >
              {isVerifying ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Verificando...
                </>
              ) : (
                "Verificar e Criar Conta"
              )}
            </Button>

            <Button
              type="button"
              variant="ghost"
              className="w-full"
              onClick={handleBackToRegister}
              data-testid="button-back"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar ao Registro
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}