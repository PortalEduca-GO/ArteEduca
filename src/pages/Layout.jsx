

import React, { useCallback } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { User } from "@/api/entities";
import {
  LayoutDashboard, Plus, FileText, User as UserIcon, Menu, X, LogIn, LogOut,
  Palette, Music, Mic, PersonStanding, Drama, Guitar, Users, ChevronDown, Settings, Building2, Upload } from
"lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger } from
"@/components/ui/dropdown-menu";

export default function Layout({ children, currentPageName }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const [user, setUser] = React.useState(null);
  const [isAuthenticated, setIsAuthenticated] = React.useState(false);

  // Moved and modified getDashboardLabel to accept currentUser as per requirements
  const getDashboardLabel = (currentUser) => {
    switch (currentUser?.app_role) {
      case 'professor':return 'Meus Projetos';
      case 'gestor':return 'Projetos da UE';
      case 'articulador':return 'Projetos da CRE';
      case 'admin':return 'Dashboard Geral';
      default:return 'Dashboard';
    }
  };

  const checkAuthenticationAndProfile = useCallback(async () => {
    try {
      const userData = await User.me();
      setUser(userData);
      setIsAuthenticated(true);

      // Verificar se é primeiro acesso (dados essenciais não preenchidos)
      const isFirstAccess = !userData.cpf || !userData.cre || !userData.inep;

      // Se é primeiro acesso E não está na página de perfil, redireciona para Profile
      if (isFirstAccess && currentPageName !== "Profile") {
        navigate(createPageUrl("Profile"));
        return;
      }

      // Se não é primeiro acesso E está na raiz ou em página não específica,
      // redireciona para o dashboard do perfil
      if (!isFirstAccess && (currentPageName === "" || window.location.pathname === "/")) {
        navigate(createPageUrl("Dashboard"));
        return;
      }

    } catch (error) {
      setIsAuthenticated(false);
      console.error("Authentication error:", error);
    }
  }, [navigate, currentPageName]);

  React.useEffect(() => {
    checkAuthenticationAndProfile();
  }, [checkAuthenticationAndProfile]);

  const handleLogin = async () => {
    try {
      const callbackUrl = `${window.location.origin}${window.location.pathname}`;
      await User.loginWithRedirect(callbackUrl);
      // Recarregar para atualizar o estado
      window.location.reload();
    } catch (error) {
      console.error("Login error:", error);
    }
  };

  const handleLogout = async () => {
    try {
      await User.logout();
      setUser(null);
      setIsAuthenticated(false);
      window.location.reload();
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const navigationItems = [
  { name: "Dashboard", path: createPageUrl("Dashboard"), icon: LayoutDashboard }];


  const projectTypes = [
  { name: 'Artes Visuais', type: 'artesVisuais', icon: Palette, color: 'text-red-500' },
  { name: 'Bandas e Fanfarras', type: 'bandasEFanfarras', icon: Music, color: 'text-blue-500' },
  { name: 'Canto Coral', type: 'cantoCoral', icon: Mic, color: 'text-green-500' },
  { name: 'Dança', type: 'danca', icon: PersonStanding, color: 'text-purple-500' },
  { name: 'Prática de Conjunto', type: 'praticaDeConjunto', icon: Users, color: 'text-yellow-500' },
  { name: 'Teatro', type: 'teatro', icon: Drama, color: 'text-orange-500' },
  { name: 'Violão', type: 'violao', icon: Guitar, color: 'text-indigo-500' }];

  // Calculate dashboardLabel once using the getDashboardLabel function and user state
  const dashboardLabel = getDashboardLabel(user);

  const isActive = (path) => location.pathname === path;

  return (
    <div className="min-h-screen overflow-x-hidden" style={{ backgroundColor: "#e8e9ea" }}>
      <style>{`
        :root {
          --neu-bg: #ffffff;
          --neu-light: #f8f9fa;
          --neu-dark: #e9ecef;
          --neu-primary: #0d7377;
          --neu-secondary: #14a085;
          --neu-accent: #41b883;
          --neu-text: #212529;
          --neu-text-light: #6c757d;
          --neu-success: #28a745;
          --neu-info: #17a2b8;
          --neu-warning: #ffc107;
          --neu-danger: #dc3545;
        }

        * {
          -webkit-tap-highlight-color: transparent;
        }

        body {
          overflow-x: hidden;
          -webkit-overflow-scrolling: touch;
          background-color: #e8e9ea;
        }

        .neu-inset {
          background: var(--neu-bg);
          box-shadow: inset 4px 4px 8px var(--neu-dark), inset -4px -4px 8px var(--neu-light);
          border: 1px solid #e9ecef;
        }

        .neu-raised {
          background: var(--neu-bg);
          box-shadow: 4px 4px 8px var(--neu-dark), -4px -4px 8px var(--neu-light);
          border: 1px solid #e9ecef;
        }

        .neu-pressed {
          background: linear-gradient(135deg, var(--neu-secondary) 0%, var(--neu-primary) 100%);
          box-shadow: inset 2px 2px 4px rgba(0,0,0,0.1);
          color: white !important;
          border: 1px solid var(--neu-primary);
        }

        .neu-button {
          background: var(--neu-bg);
          box-shadow: 2px 2px 4px var(--neu-dark), -2px -2px 4px var(--neu-light);
          border: 1px solid #e9ecef;
          transition: all 0.2s ease;
          min-height: 44px;
          min-width: 44px;
          touch-action: manipulation;
        }

        .neu-button-primary {
          background: #14a085; /* Cor verde do tema */
          color: white;
          box-shadow: 2px 2px 4px var(--neu-dark), -2px -2px 4px var(--neu-light);
          border: 1px solid #0d7377;
          transition: all 0.2s ease;
          min-height: 44px;
          min-width: 44px;
          touch-action: manipulation;
        }

        .neu-button-primary:hover {
          background: #118a71; /* Tom mais escuro para hover */
          box-shadow: 3px 3px 6px var(--neu-dark), -3px -3px 6px var(--neu-light);
          transform: translateY(-1px);
        }

        .neu-button-primary:active {
          box-shadow: inset 1px 1px 2px var(--neu-dark);
          transform: translateY(0);
        }

        .neu-button:hover {
          background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
          box-shadow: 3px 3px 6px var(--neu-dark), -3px -3px 6px var(--neu-light);
          transform: translateY(-1px);
          border-color: var(--neu-secondary);
        }

        .neu-button:active {
          box-shadow: inset 1px 1px 2px var(--neu-dark);
          transform: translateY(0);
        }

        .neu-card {
          background: var(--neu-bg);
          box-shadow: 6px 6px 12px var(--neu-dark), -6px -6px 12px var(--neu-light);
          border-radius: 16px;
          border: 1px solid #e9ecef;
        }

        .neu-input {
          background: var(--neu-bg);
          box-shadow: inset 2px 2px 4px var(--neu-dark), inset -2px -2px 4px var(--neu-light);
          border: 1px solid #ced4da;
          border-radius: 8px;
          min-height: 44px;
          transition: all 0.2s ease;
        }

        .neu-input:focus {
          outline: none;
          box-shadow: inset 3px 3px 6px var(--neu-dark), inset -3px -3px 6px var(--neu-light);
          border-color: var(--neu-primary);
        }

        .btn-primary {
          background: linear-gradient(135deg, var(--neu-secondary) 0%, var(--neu-primary) 100%);
          color: white;
          border: 1px solid var(--neu-primary);
          box-shadow: 2px 2px 4px rgba(0,0,0,0.1);
          transition: all 0.2s ease; /* Ensure transition for hover/active effects */
        }

        .btn-primary:hover {
          background: linear-gradient(135deg, var(--neu-primary) 0%, #0a5d61 100%);
          box-shadow: 3px 3px 6px rgba(0,0,0,0.15);
          transform: translateY(-1px);
        }

        .btn-primary:active {
          box-shadow: inset 1px 1px 2px rgba(0,0,0,0.1);
          transform: translateY(0);
        }

        .text-primary {
          color: var(--neu-primary) !important;
        }

        .text-secondary {
          color: var(--neu-secondary) !important;
        }

        .bg-primary {
          background: linear-gradient(135deg, var(--neu-secondary) 0%, var(--neu-primary) 100%) !important;
        }

        .border-primary {
          border-color: var(--neu-primary) !important;
        }

        @media (max-width: 768px) {
          .neu-card {
            border-radius: 12px;
            box-shadow: 3px 3px 6px var(--neu-dark), -3px -3px 6px var(--neu-light);
          }

          .neu-button {
            box-shadow: 1px 1px 2px var(--neu-dark), -1px -1px 2px var(--neu-light);
          }
          .btn-primary {
            box-shadow: 1px 1px 2px rgba(0,0,0,0.1);
          }
        }
      `}</style>

      <header className="lg:hidden neu-card mx-2 mt-2 p-3 sticky top-2 z-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="neu-raised p-1 rounded-full flex items-center justify-center">
              <img
                src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68d01ff17e017d39292ccc5f/5700ff79c_logo-Ciranda-ico.png"
                alt="Ciranda da Arte Logo"
                className="w-8 h-8" />

            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-800">Ciranda da Arte</h1>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {isAuthenticated ?
            <button
              onClick={handleLogout}
              className="btn-primary p-2 rounded-lg"
              title="Logout">
                <LogOut className="w-4 h-4" />
              </button> :
            <button
              onClick={handleLogin}
              className="btn-primary p-2 rounded-lg"
              title="Admin Login">
                <LogIn className="w-4 h-4" />
              </button>
            }
          </div>
        </div>
      </header>

      <header className="hidden lg:block neu-card mx-6 mt-6 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="neu-raised p-1 rounded-full flex items-center justify-center">
              <img
                src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68d01ff17e017d39292ccc5f/5700ff79c_logo-Ciranda-ico.png"
                alt="Ciranda da Arte Logo" className="w-10 h-10" />


            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-800">Ciranda da Arte</h1>
              <p className="text-sm text-gray-700">Centro de Estudo e Pesquisa</p>
              <p className="text-xs text-gray-600">Secretaria de Estado da Educação</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            {isAuthenticated ? <div className="flex items-center space-x-3">
                <span className="text-sm text-gray-600">Bem-vindo, {user?.full_name || user?.email}</span>
                <button
                onClick={handleLogout}
                className="btn-primary px-4 py-2 rounded-lg">
                  Logout
                </button>
              </div> :

            <button
              onClick={handleLogin}
              className="btn-primary px-4 py-2 rounded-lg flex items-center space-x-2">
                <LogIn className="w-4 h-4" />
                <span>Admin Login</span>
              </button>
            }
          </div>
        </div>
      </header>

      {mobileMenuOpen &&
      <div className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40" onClick={() => setMobileMenuOpen(false)}>
          <div className="neu-card m-2 mt-16 p-4" onClick={(e) => e.stopPropagation()}>
            <div className="space-y-2">
              <Link
              to={navigationItems[0].path}
              onClick={() => setMobileMenuOpen(false)}
              className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 ${
              isActive(navigationItems[0].path) ?
              "neu-pressed text-blue-600" :
              "neu-button text-gray-700 hover:text-gray-900"}`
              }>
                <LayoutDashboard className="w-5 h-5" />
                <span className="font-medium">{dashboardLabel}</span>
              </Link>

              <div className="neu-button p-4 rounded-xl text-gray-700 hover:text-gray-900">
                <div className="flex items-center justify-between font-medium">
                  <div className="flex items-center space-x-3">
                    <Plus className="w-5 h-5" />
                    <span>Novo Projeto</span>
                  </div>
                </div>
              </div>
              <div className="pl-4 space-y-1">
                {projectTypes.map((project) =>
              <Link
                key={project.type}
                to={createPageUrl(`ProjetoArteEduca?tipo=${project.type}`)}
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center space-x-3 px-4 py-2 rounded-xl text-gray-600 hover:bg-gray-100">
                    <project.icon className={`w-5 h-5 ${project.color}`} />
                    <span>{project.name}</span>
                  </Link>
              )}
              </div>

              {/* Configurações Menu Mobile */}
              <div className="neu-button p-4 rounded-xl text-gray-700 hover:text-gray-900">
                <div className="flex items-center justify-between font-medium">
                  <div className="flex items-center space-x-3">
                    <Settings className="w-5 h-5" />
                    <span>Configurações</span>
                  </div>
                </div>
              </div>
              <div className="pl-4 space-y-1">
                {user?.app_role === 'admin' &&
              <>
                    <Link
                  to={createPageUrl("GerenciarUsuarios")}
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center space-x-3 px-4 py-2 rounded-xl text-gray-600 hover:bg-gray-100">
                      <Users className="w-5 h-5" />
                      <span>Gerenciamento de Usuários</span>
                    </Link>
                    <Link
                  to={createPageUrl("GerenciarEscolas")}
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center space-x-3 px-4 py-2 rounded-xl text-gray-600 hover:bg-gray-100">
                      <Building2 className="w-5 h-5" />
                      <span>Gerenciamento de Escolas</span>
                    </Link>
                    <Link
                  to={createPageUrl("ImportarEscolas")}
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center space-x-3 px-4 py-2 rounded-xl text-gray-600 hover:bg-gray-100">
                      <Upload className="w-5 h-5" />
                      <span>Importar Escolas</span>
                    </Link>
                  </>
              }
                <Link
                to={createPageUrl("Profile")}
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center space-x-3 px-4 py-2 rounded-xl text-gray-600 hover:bg-gray-100">
                  <UserIcon className="w-5 h-5" />
                  <span>Editar Perfil</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      }

      <nav className="hidden lg:block neu-card mx-6 mt-6 p-2">
        <div className="flex space-x-2">
          {/* Dashboard Button */}
          <Link
            key="Dashboard"
            to={createPageUrl("Dashboard")}
            className={`flex items-center space-x-2 px-4 py-3 rounded-xl transition-all duration-200 ${
            isActive(createPageUrl("Dashboard")) ?
            "neu-pressed text-blue-600" :
            "neu-button text-gray-700 hover:text-gray-900"}`
            }>
            <LayoutDashboard className="w-5 h-5" />
            <span className="font-medium">{dashboardLabel}</span>
          </Link>

          {/* Novo Projeto Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="neu-button text-gray-700 hover:text-gray-900 flex items-center space-x-2 px-4 py-3 rounded-xl transition-all duration-200">
                <Plus className="w-5 h-5" />
                <span className="font-medium">Novo Projeto</span>
                <ChevronDown className="w-4 h-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="neu-card">
              {projectTypes.map((project) =>
              <DropdownMenuItem key={project.type} asChild>
                  <Link to={createPageUrl(`ProjetoArteEduca?tipo=${project.type}`)} className="flex items-center space-x-2 cursor-pointer">
                    <project.icon className={`w-4 h-4 mr-2 ${project.color}`} />
                    <span>{project.name}</span>
                  </Link>
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Configurações Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="neu-button text-gray-700 hover:text-gray-900 flex items-center space-x-2 px-4 py-3 rounded-xl transition-all duration-200">
                <Settings className="w-5 h-5" />
                <span className="font-medium">Configurações</span>
                <ChevronDown className="w-4 h-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="neu-card">
              {user?.app_role === 'admin' &&
              <>
                  <DropdownMenuItem asChild>
                    <Link to={createPageUrl("GerenciarUsuarios")} className="flex items-center space-x-2 cursor-pointer">
                      <Users className="w-4 h-4 mr-2" />
                      <span>Gerenciamento de Usuários</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to={createPageUrl("GerenciarEscolas")} className="flex items-center space-x-2 cursor-pointer">
                      <Building2 className="w-4 h-4 mr-2" />
                      <span>Gerenciamento de Escolas</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to={createPageUrl("ImportarEscolas")} className="flex items-center space-x-2 cursor-pointer">
                      <Upload className="w-4 h-4 mr-2" />
                      <span>Importar Escolas</span>
                    </Link>
                  </DropdownMenuItem>
                </>
              }
              <DropdownMenuItem asChild>
                <Link to={createPageUrl("Profile")} className="flex items-center space-x-2 cursor-pointer">
                  <UserIcon className="w-4 h-4 mr-2" />
                  <span>Editar Perfil</span>
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </nav>

      <div className="lg:hidden fixed bottom-0 left-0 right-0 neu-card mx-2 mb-2 p-2 z-50">
        <div className="flex justify-around">
          <Link
            to={navigationItems[0].path}
            className={`flex flex-col items-center space-y-1 px-3 py-2 rounded-xl transition-all duration-200 ${
            isActive(navigationItems[0].path) ?
            "neu-pressed text-blue-600" :
            "text-gray-700 hover:text-gray-900"}`
            }>
            <LayoutDashboard className="w-5 h-5" />
            <span className="text-xs font-medium text-center">{user?.app_role === 'professor' ? 'Meus Projetos' : dashboardLabel.split(' ')[0]}</span>
          </Link>
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="flex flex-col items-center space-y-1 px-3 py-2 rounded-xl transition-all duration-200 text-gray-700 hover:text-gray-900">
            <Plus className="w-5 h-5" />
            <span className="text-xs font-medium">Novo</span>
          </button>
          <button
            onClick={() => setMobileMenuOpen(true)}
            className={`flex flex-col items-center space-y-1 px-3 py-2 rounded-xl transition-all duration-200 ${
            isActive(createPageUrl("Profile")) ?
            "neu-pressed text-blue-600" :
            "text-gray-700 hover:text-gray-900"}`
            }>
            <Settings className="w-5 h-5" />
            <span className="text-xs font-medium">Config</span>
          </button>
          {user?.app_role === 'admin' &&
          <Link
            to={createPageUrl("GerenciarUsuarios")}
            className={`flex flex-col items-center space-y-1 px-3 py-2 rounded-xl transition-all duration-200 ${
            isActive(createPageUrl("GerenciarUsuarios")) ?
            "neu-pressed text-blue-600" :
            "text-gray-700 hover:text-gray-900"}`
            }>
              <Users className="w-5 h-5" />
              <span className="text-xs font-medium">Usuários</span>
            </Link>
          }
        </div>
      </div>

      <main className="p-2 sm:p-4 lg:p-6 pb-20 lg:pb-6">
        {children}
      </main>
    </div>);

}

