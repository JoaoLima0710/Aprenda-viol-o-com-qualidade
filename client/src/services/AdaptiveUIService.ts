/**
 * Adaptive UI Service - 2026 Edition
 * Sistema de design adaptativo baseado no contexto de uso
 */

export interface UIContext {
  lighting: 'bright' | 'dim' | 'dark';
  timeOfDay: 'day' | 'night' | 'dusk';
  activity: 'practice' | 'performance' | 'study' | 'casual';
  deviceOrientation: 'portrait' | 'landscape';
  userMood?: 'focused' | 'frustrated' | 'confident' | 'tired';
  location?: 'home' | 'outdoor' | 'stage' | 'studio';
}

export interface AdaptiveTheme {
  name: string;
  mode: 'fireplace' | 'sheet_music' | 'performance' | 'study';
  colors: {
    background: string;
    surface: string;
    text: string;
    textSecondary: string;
    accent: string;
    chord: string;
    highlight: string;
    border: string;
  };
  typography: {
    fontFamily: string;
    fontSize: 'sm' | 'md' | 'lg';
    lineHeight: number;
    letterSpacing: number;
  };
  effects: {
    shadows: boolean;
    gradients: boolean;
    glow: boolean;
    animations: 'none' | 'minimal' | 'smooth';
  };
  spacing: {
    compact: boolean;
    touchTargets: 'small' | 'medium' | 'large';
  };
}

class AdaptiveUIService {
  private currentContext: UIContext = {
    lighting: 'bright',
    timeOfDay: 'day',
    activity: 'practice',
    deviceOrientation: 'portrait'
  };

  private contextDetectionEnabled = true;

  /**
   * Detecta automaticamente o contexto de uso
   */
  async detectContext(): Promise<UIContext> {
    const context: UIContext = { ...this.currentContext };

    // Detectar iluminação (simulado com sensor de luz)
    await this.detectLighting(context);

    // Detectar horário do dia
    context.timeOfDay = this.detectTimeOfDay();

    // Detectar orientação do dispositivo
    context.deviceOrientation = this.detectDeviceOrientation();

    // Detectar atividade baseada no histórico recente
    context.activity = await this.detectActivity();

    // Detectar localização (simulado com GPS)
    context.location = await this.detectLocation();

    this.currentContext = context;
    return context;
  }

  /**
   * Retorna tema adaptativo baseado no contexto
   */
  getAdaptiveTheme(context: UIContext): AdaptiveTheme {
    // Lógica de decisão baseada no contexto
    if (context.lighting === 'dark' && (context.activity === 'performance' || context.location === 'stage')) {
      return this.getFireplaceTheme();
    } else if (context.lighting === 'bright' && context.activity === 'study') {
      return this.getSheetMusicTheme();
    } else if (context.activity === 'performance') {
      return this.getPerformanceTheme();
    } else {
      return this.getStudyTheme();
    }
  }

  /**
   * Modo Fogueira - Alto Contraste Noturno
   * Para ambientes com pouca luz (quartos, luaus)
   */
  private getFireplaceTheme(): AdaptiveTheme {
    return {
      name: 'Modo Fogueira',
      mode: 'fireplace',
      colors: {
        background: '#000000', // Preto verdadeiro OLED
        surface: '#0a0a0a',
        text: '#ffffff', // Branco puro
        textSecondary: '#cccccc',
        accent: '#FFD700', // Amarelo Ouro
        chord: '#00FFFF', // Ciano Brilhante
        highlight: '#FFD700',
        border: '#333333'
      },
      typography: {
        fontFamily: 'Inter, sans-serif',
        fontSize: 'lg',
        lineHeight: 1.8,
        letterSpacing: 0.05 // Aumentado para melhor leitura
      },
      effects: {
        shadows: false, // Sem sombras
        gradients: false, // Sem gradientes
        glow: true, // Apenas brilho
        animations: 'minimal'
      },
      spacing: {
        compact: true,
        touchTargets: 'large'
      }
    };
  }

  /**
   * Modo Partitura - Papel Digital
   * Para estudo diurno ou leitura séria
   */
  private getSheetMusicTheme(): AdaptiveTheme {
    return {
      name: 'Modo Partitura',
      mode: 'sheet_music',
      colors: {
        background: '#F5F5F0', // Off-White/Creme
        surface: '#FFFFFF',
        text: '#2D3748', // Cinza Chumbo
        textSecondary: '#718096',
        accent: '#2B6CB0', // Azul Marinho
        chord: '#8B0000', // Vinho
        highlight: '#FFD700',
        border: '#E2E8F0'
      },
      typography: {
        fontFamily: 'Merriweather, serif', // Serif para letras de música
        fontSize: 'md',
        lineHeight: 2.0,
        letterSpacing: 0
      },
      effects: {
        shadows: true,
        gradients: false,
        glow: false,
        animations: 'smooth'
      },
      spacing: {
        compact: false,
        touchTargets: 'medium'
      }
    };
  }

  /**
   * Modo Performance - Otimizado para palco
   */
  private getPerformanceTheme(): AdaptiveTheme {
    return {
      name: 'Modo Performance',
      mode: 'performance',
      colors: {
        background: '#000000',
        surface: '#1a1a1a',
        text: '#ffffff',
        textSecondary: '#cccccc',
        accent: '#FF6B35', // Laranja vibrante
        chord: '#00FF88', // Verde neon
        highlight: '#FF6B35',
        border: '#333333'
      },
      typography: {
        fontFamily: 'Inter, sans-serif',
        fontSize: 'lg',
        lineHeight: 1.6,
        letterSpacing: 0.02
      },
      effects: {
        shadows: true,
        gradients: true,
        glow: true,
        animations: 'smooth'
      },
      spacing: {
        compact: true,
        touchTargets: 'large'
      }
    };
  }

  /**
   * Modo Estudo - Equilibrado
   */
  private getStudyTheme(): AdaptiveTheme {
    return {
      name: 'Modo Estudo',
      mode: 'study',
      colors: {
        background: '#0f172a',
        surface: '#1e293b',
        text: '#f8fafc',
        textSecondary: '#94a3b8',
        accent: '#8b5cf6',
        chord: '#06b6d4',
        highlight: '#f59e0b',
        border: '#334155'
      },
      typography: {
        fontFamily: 'Inter, sans-serif',
        fontSize: 'md',
        lineHeight: 1.7,
        letterSpacing: 0
      },
      effects: {
        shadows: true,
        gradients: true,
        glow: false,
        animations: 'smooth'
      },
      spacing: {
        compact: false,
        touchTargets: 'medium'
      }
    };
  }

  /**
   * Aplica tema adaptativo
   */
  applyAdaptiveTheme(theme: AdaptiveTheme): void {
    const root = document.documentElement;

    // Aplicar cores
    Object.entries(theme.colors).forEach(([key, value]) => {
      root.style.setProperty(`--adaptive-${key}`, value);
    });

    // Aplicar tipografia
    root.style.setProperty('--adaptive-font-family', theme.typography.fontFamily);
    root.style.setProperty('--adaptive-line-height', theme.typography.lineHeight.toString());
    root.style.setProperty('--adaptive-letter-spacing', theme.typography.letterSpacing.toString());

    // Aplicar efeitos
    root.classList.toggle('adaptive-no-shadows', !theme.effects.shadows);
    root.classList.toggle('adaptive-no-gradients', !theme.effects.gradients);
    root.classList.toggle('adaptive-glow', theme.effects.glow);

    // Aplicar espaçamento
    root.classList.toggle('adaptive-compact', theme.spacing.compact);
    root.classList.toggle('adaptive-large-touch', theme.spacing.touchTargets === 'large');

    // Notificar componentes sobre mudança de tema
    window.dispatchEvent(new CustomEvent('adaptiveThemeChanged', {
      detail: theme
    }));
  }

  /**
   * Força um modo específico
   */
  forceThemeMode(mode: AdaptiveTheme['mode']): void {
    let theme: AdaptiveTheme;

    switch (mode) {
      case 'fireplace':
        theme = this.getFireplaceTheme();
        break;
      case 'sheet_music':
        theme = this.getSheetMusicTheme();
        break;
      case 'performance':
        theme = this.getPerformanceTheme();
        break;
      case 'study':
      default:
        theme = this.getStudyTheme();
        break;
    }

    this.applyAdaptiveTheme(theme);
  }

  // ========== DETECÇÃO DE CONTEXTO ==========

  private async detectLighting(context: UIContext): Promise<void> {
    // Simulação de sensor de luz
    // Em produção, usaria DeviceLightEvent ou similar
    try {
      // Simular detecção baseada no horário e outros fatores
      const hour = new Date().getHours();
      const isNight = hour < 6 || hour > 22;

      if (isNight) {
        context.lighting = 'dark';
      } else if (hour > 18 || hour < 8) {
        context.lighting = 'dim';
      } else {
        context.lighting = 'bright';
      }
    } catch {
      context.lighting = 'bright'; // Fallback
    }
  }

  private detectTimeOfDay(): UIContext['timeOfDay'] {
    const hour = new Date().getHours();

    if (hour >= 6 && hour < 12) return 'day';
    if (hour >= 12 && hour < 18) return 'day';
    if (hour >= 18 && hour < 22) return 'dusk';
    return 'night';
  }

  private detectDeviceOrientation(): UIContext['deviceOrientation'] {
    // Simulação - em produção usaria screen.orientation
    return window.innerWidth > window.innerHeight ? 'landscape' : 'portrait';
  }

  private async detectActivity(): Promise<UIContext['activity']> {
    // Baseado no histórico recente do usuário
    // Simulação - em produção analisaria padrões de uso
    const recentActions = this.getRecentUserActions();

    if (recentActions.includes('performance')) return 'performance';
    if (recentActions.includes('study')) return 'study';
    if (recentActions.includes('practice')) return 'practice';

    return 'casual';
  }

  private async detectLocation(): Promise<UIContext['location']> {
    // Simulação - em produção usaria geolocalização
    // Por exemplo: se coordenadas indicam palco/estúdio
    return 'home'; // Fallback
  }

  private getRecentUserActions(): string[] {
    // Simulação - em produção viria do histórico do usuário
    return ['practice', 'study'];
  }

  /**
   * Toggle detecção automática de contexto
   */
  setContextDetection(enabled: boolean): void {
    this.contextDetectionEnabled = enabled;
  }

  /**
   * Obtém contexto atual
   */
  getCurrentContext(): UIContext {
    return { ...this.currentContext };
  }

  /**
   * Atualiza contexto manualmente
   */
  updateContext(updates: Partial<UIContext>): void {
    this.currentContext = { ...this.currentContext, ...updates };
  }
}

export const adaptiveUIService = new AdaptiveUIService();
