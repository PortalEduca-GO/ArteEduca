import React, { useState, useEffect } from 'react';
import { User } from '@/api/entities';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import {
  Box,
  Card,
  CardContent,
  Container,
  Divider,
  TextField,
  InputAdornment,
  IconButton,
  Button,
  Typography,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  Person as PersonIcon,
  Lock as LockIcon,
  Visibility,
  VisibilityOff,
} from '@mui/icons-material';
import bcrypt from 'bcryptjs';

export default function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Buscar todos os usuários
      const users = await User.list();
      console.log('📋 Total de usuários encontrados:', users.length);
      
      // Encontrar usuário pelo email
      const user = users.find(u => u.email?.toLowerCase() === email.toLowerCase());
      
      if (!user) {
        console.log('❌ Usuário não encontrado para:', email);
        console.log('📧 Emails disponíveis:', users.map(u => u.email));
        setError('Email ou senha incorretos');
        setLoading(false);
        return;
      }
      
      console.log('✅ Usuário encontrado:', user.email);

      // Verificar senha
      let passwordValid = false;
      
      if (user.password) {
        console.log('🔐 Verificando senha...');
        // Se a senha estiver hasheada, usar bcrypt
        if (user.password.startsWith('$2a$') || user.password.startsWith('$2b$')) {
          console.log('🔑 Senha hasheada detectada, usando bcrypt');
          passwordValid = await bcrypt.compare(password, user.password);
          console.log('🔍 Resultado bcrypt:', passwordValid);
        } else {
          console.log('⚠️ Senha em texto plano detectada');
          // Senha em texto plano (migração antiga)
          passwordValid = user.password === password;
          
          // Se for válida, atualizar para hash
          if (passwordValid) {
            console.log('✅ Senha válida, hasheando...');
            const hashedPassword = await bcrypt.hash(password, 10);
            await User.update(user.id, { password: hashedPassword });
          }
        }
      } else {
        console.log('❌ Usuário sem senha cadastrada');
        setError('Usuário sem senha cadastrada. Entre em contato com o administrador.');
        setLoading(false);
        return;
      }

      if (!passwordValid) {
        console.log('❌ Senha inválida');
        setError('Email ou senha incorretos');
        setLoading(false);
        return;
      }
      
      console.log('✅ Login bem-sucedido!');

      // Login bem-sucedido - atualizar sessão
      localStorage.setItem('currentUser', JSON.stringify(user));
      localStorage.setItem('isAuthenticated', 'true');
      
      // Redirecionar baseado no perfil completado ou não
      const isProfileComplete = user.cpf && user.cre && user.inep;
      
      if (isProfileComplete) {
        navigate(createPageUrl('Dashboard'));
      } else {
        navigate(createPageUrl('Profile'));
      }
      
      window.location.reload(); // Recarregar para atualizar contexto global
      
    } catch (error) {
      console.error('Erro ao fazer login:', error);
      setError('Erro ao processar login. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--brand-bg)',
        padding: 2,
      }}
    >
      <Container component="main" maxWidth="sm">
        <Card
          elevation={24}
          sx={{
            borderRadius: 4,
            overflow: 'hidden',
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(10px)',
          }}
        >
          <CardContent sx={{ p: 6 }}>
            {/* Logo e Título */}
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                mb: 4,
              }}
            >
              <Box sx={{ width: 120, mb: 2 }}>
                <img
                  src="/logo.webp"
                  alt="Arte Educa"
                  style={{ width: '100%', height: 'auto' }}
                />
              </Box>
              <Typography variant="h6" color="text.secondary" sx={{ fontWeight: 300, textAlign: 'center' }}>
                Arte Educa
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1, textAlign: 'center', opacity: 0.8 }}>
                Faça login para acessar o sistema de gestão de projetos
              </Typography>
            </Box>

            <Divider sx={{ mb: 4 }} />

            {/* Alertas de Erro */}
            {error && (
              <Alert severity="error" sx={{ width: '100%', mb: 3, borderRadius: 2 }}>
                {error}
              </Alert>
            )}

            {/* Formulário */}
            <Box component="form" onSubmit={handleLogin}>
              <TextField
                fullWidth
                required
                label="Email"
                autoComplete="username"
                autoFocus
                disabled={loading}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <PersonIcon color="action" />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  mb: 2,
                  '& .MuiOutlinedInput-root': { borderRadius: 2 },
                }}
              />

              <TextField
                fullWidth
                required
                label="Senha"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                disabled={loading}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LockIcon color="action" />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={() => setShowPassword(!showPassword)} edge="end" disabled={loading}>
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                sx={{
                  mb: 3,
                  '& .MuiOutlinedInput-root': { borderRadius: 2 },
                }}
              />

              <Button
                type="submit"
                fullWidth
                variant="contained"
                disabled={loading}
                sx={{
                  mt: 2,
                  mb: 2,
                  py: 1.5,
                  borderRadius: 2,
                  background: 'var(--brand-cta)',
                  boxShadow: '0 6px 18px rgba(32, 36, 115, 0.35)',
                  fontSize: '1.1rem',
                  fontWeight: 'bold',
                  textTransform: 'none',
                  '&:hover': {
                    background: 'var(--brand-cta-hover)',
                    boxShadow: '0 10px 24px rgba(32, 36, 115, 0.45)',
                  },
                  '&:disabled': { background: 'rgba(0, 0, 0, 0.12)', boxShadow: 'none' },
                }}
              >
                {loading ? <CircularProgress size={24} sx={{ color: '#fff' }} /> : 'Entrar'}
              </Button>
            </Box>

            {/* Footer */}
            <Box
              sx={{
                mt: 4,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 1.5,
              }}
            >
              <Typography variant="body2" color="text.secondary">
                © {new Date().getFullYear()} Arte Educa - Sistema de Gestão de Projetos
              </Typography>
              <Box
                component="img"
                src="/logo-estado.webp"
                alt="Governo de Goiás"
                sx={{
                  height: 48,
                  width: 'auto',
                  filter: 'drop-shadow(0 6px 12px rgba(32, 36, 115, 0.2))',
                }}
              />
            </Box>
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
}
