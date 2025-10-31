import React from 'react'
import ReactDOM from 'react-dom/client'
import { ThemeProvider, CssBaseline } from '@mui/material'
import App from '@/App.jsx'
import { appTheme } from '@/theme.js'
import '@fontsource/roboto/300.css'
import '@fontsource/roboto/400.css'
import '@fontsource/roboto/500.css'
import '@fontsource/roboto/700.css'
import '@/styles/globals.css'
import '@/index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
    <ThemeProvider theme={appTheme}>
        <CssBaseline />
        <App />
    </ThemeProvider>
)