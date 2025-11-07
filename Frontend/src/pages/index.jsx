import Layout from "./Layout.jsx";

import Dashboard from "./Dashboard";

import CreateForm from "./CreateForm";

import MyForms from "./MyForms";

import EditForm from "./EditForm";

import FormView from "./FormView";

import FormData from "./FormData";

import ImportFromPDF from "./ImportFromPDF";

import ProjetoArteEduca from "./ProjetoArteEduca";

import Profile from "./Profile";

import TermoCompromisso from "./TermoCompromisso";

import GerenciarUsuarios from "./GerenciarUsuarios";

import GerenciarEscolas from "./GerenciarEscolas";

import ImportarEscolas from "./ImportarEscolas";

import DeclaracaoCre from "./DeclaracaoCre";

import Login from "./Login";

import { BrowserRouter as Router, Route, Routes, useLocation, Navigate } from 'react-router-dom';

const PAGES = {
    
    Dashboard: Dashboard,
    
    CreateForm: CreateForm,
    
    MyForms: MyForms,
    
    EditForm: EditForm,
    
    FormView: FormView,
    
    FormData: FormData,
    
    ImportFromPDF: ImportFromPDF,
    
    ProjetoArteEduca: ProjetoArteEduca,
    
    Profile: Profile,
    
    TermoCompromisso: TermoCompromisso,
    
    GerenciarUsuarios: GerenciarUsuarios,
    
    GerenciarEscolas: GerenciarEscolas,
    
    ImportarEscolas: ImportarEscolas,
    
    DeclaracaoCre: DeclaracaoCre,
    
    Login: Login,
    
}

function _getCurrentPage(url) {
    if (url.endsWith('/')) {
        url = url.slice(0, -1);
    }
    let urlLastPart = url.split('/').pop();
    if (urlLastPart.includes('?')) {
        urlLastPart = urlLastPart.split('?')[0];
    }

    const pageName = Object.keys(PAGES).find(page => page.toLowerCase() === urlLastPart.toLowerCase());
    return pageName || Object.keys(PAGES)[0];
}

// Protected Route Component
function ProtectedRoute({ children }) {
    const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';
    const currentUser = localStorage.getItem('currentUser');
    
    if (!isAuthenticated || !currentUser) {
        return <Navigate to="/Login" replace />;
    }
    
    return children;
}

// Create a wrapper component that uses useLocation inside the Router context
function PagesContent() {
    const location = useLocation();
    const currentPage = _getCurrentPage(location.pathname);
    
    // Páginas públicas que não precisam de autenticação
    const publicPages = ['/Login'];
    const isPublicPage = publicPages.includes(location.pathname);
    
    // Se for página pública, renderizar sem Layout
    if (isPublicPage) {
        return (
            <Routes>
                <Route path="/Login" element={<Login />} />
            </Routes>
        );
    }
    
    // Páginas protegidas com Layout
    return (
        <ProtectedRoute>
            <Layout currentPageName={currentPage}>
                <Routes>            
                    
                        <Route path="/" element={<Dashboard />} />
                    
                    
                    <Route path="/Dashboard" element={<Dashboard />} />
                    
                    <Route path="/CreateForm" element={<CreateForm />} />
                    
                    <Route path="/MyForms" element={<MyForms />} />
                    
                    <Route path="/EditForm" element={<EditForm />} />
                    
                    <Route path="/FormView" element={<FormView />} />
                    
                    <Route path="/FormData" element={<FormData />} />
                    
                    <Route path="/ImportFromPDF" element={<ImportFromPDF />} />
                    
                    <Route path="/ProjetoArteEduca" element={<ProjetoArteEduca />} />
                    
                    <Route path="/Profile" element={<Profile />} />
                    
                    <Route path="/TermoCompromisso" element={<TermoCompromisso />} />
                    
                    <Route path="/GerenciarUsuarios" element={<GerenciarUsuarios />} />
                    
                    <Route path="/GerenciarEscolas" element={<GerenciarEscolas />} />
                    
                    <Route path="/ImportarEscolas" element={<ImportarEscolas />} />
                    
                    <Route path="/DeclaracaoCre" element={<DeclaracaoCre />} />
                    
                </Routes>
            </Layout>
        </ProtectedRoute>
    );
}

export default function Pages() {
    return (
        <Router>
            <PagesContent />
        </Router>
    );
}