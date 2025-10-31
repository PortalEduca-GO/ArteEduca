import { createTheme } from '@mui/material/styles';

// Tema do Edu Agentes adaptado para Arte Educa
export const appTheme = createTheme({
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h6: {
      fontWeight: 300,
      fontSize: '1.25rem',
    },
    body1: {
      fontSize: '1rem',
    },
    body2: {
      fontSize: '0.875rem',
    },
    button: {
      textTransform: 'none',
      fontWeight: 600,
    },
  },
  palette: {
    mode: 'light',
    primary: {
      main: '#2E4CA6',
      light: '#49A3F2',
      dark: '#202473',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#49A3F2',
      light: '#73B9FF',
      dark: '#2E4CA6',
      contrastText: '#ffffff',
    },
    background: {
      default: '#DCEAF2',
      paper: '#ffffff',
    },
    text: {
      primary: '#0D0D0D',
      secondary: 'rgba(13, 13, 13, 0.7)',
    },
    action: {
      active: 'rgba(32, 36, 115, 0.54)',
    },
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          padding: '12px 24px',
          fontSize: '1.1rem',
          fontWeight: 'bold',
          textTransform: 'none',
          boxShadow: 'none',
        },
        contained: {
          background: 'linear-gradient(135deg, #202473 0%, #2E4CA6 50%, #49A3F2 100%)',
          boxShadow: '0 6px 18px rgba(32, 36, 115, 0.35)',
          '&:hover': {
            background: 'linear-gradient(135deg, #1B1F63 0%, #202473 50%, #2E4CA6 100%)',
            boxShadow: '0 10px 24px rgba(32, 36, 115, 0.45)',
          },
          '&:disabled': {
            background: 'rgba(0, 0, 0, 0.12)',
            boxShadow: 'none',
          },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 12,
            backgroundColor: '#EEF4FC',
            transition: 'all 0.2s',
            '&:hover': {
              backgroundColor: '#ffffff',
            },
            '&.Mui-focused': {
              backgroundColor: '#ffffff',
            },
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          boxShadow: '0 8px 32px rgba(32, 36, 115, 0.12)',
        },
      },
    },
    MuiInputAdornment: {
      styleOverrides: {
        root: {
          color: '#2E4CA6',
        },
      },
    },
  },
});
