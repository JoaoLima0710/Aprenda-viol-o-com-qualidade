/**
 * Visual Token System - 2026 Edition
 * Sistema de design tokens com neon como acento, não como plano de fundo
 */

export interface VisualTokens {
  // Backgrounds - sempre escuros e neutros
  background: {
    primary: string;      // Fundo principal (#0f0f1a)
    secondary: string;    // Superfícies elevadas (#1e293b)
    tertiary: string;     // Elementos terciários (#2d3748)
    overlay: string;      // Overlays com blur (rgba(15,15,26,0.9))
  };

  // Text - hierarquia clara sem neon constante
  text: {
    primary: string;      // Texto principal (#ffffff ou #f8fafc)
    secondary: string;    // Texto secundário (#94a3b8)
    tertiary: string;     // Texto terciário (#64748b)
    inverse: string;      // Texto sobre fundos escuros (#000000)
  };

  // Accent - neon usado estrategicamente
  accent: {
    primary: string;      // Ação principal (#8b5cf6)
    secondary: string;    // Ação secundária (#06b6d4)
    success: string;      // Sucesso (#10b981)
    warning: string;      // Aviso (#f59e0b)
    error: string;        // Erro (#ef4444)
    info: string;         // Informação (#3b82f6)
  };

  // Neon accents - usados apenas para destaques
  neon: {
    primary: string;      // Destaque principal (#00FFFF)
    secondary: string;    // Destaque secundário (#FFD700)
    success: string;      // Destaque sucesso (#00FF88)
    warning: string;      // Destaque aviso (#FFFF00)
    error: string;        // Destaque erro (#FF4444)
  };

  // Borders - sutis e funcionais
  border: {
    subtle: string;       // Bordas sutis (#334155)
    medium: string;       // Bordas médias (#475569)
    strong: string;       // Bordas fortes (#64748b)
    accent: string;       // Bordas de destaque (#8b5cf6)
  };

  // Shadows - usadas economicamente
  shadow: {
    subtle: string;       // Sombra sutil (0 1px 2px rgba(0,0,0,0.1))
    medium: string;       // Sombra média (0 4px 6px rgba(0,0,0,0.1))
    strong: string;       // Sombra forte (0 10px 15px rgba(0,0,0,0.1))
    glow: string;         // Brilho neon (0 0 20px rgba(139,92,246,0.3))
  };

  // Spacing - escala consistente
  spacing: {
    xs: string;    // 0.25rem
    sm: string;    // 0.5rem
    md: string;    // 1rem
    lg: string;    // 1.5rem
    xl: string;    // 2rem
    '2xl': string; // 3rem
  };

  // Border radius - consistente
  radius: {
    none: string;   // 0
    sm: string;     // 0.25rem
    md: string;     // 0.5rem
    lg: string;     // 0.75rem
    xl: string;     // 1rem
    full: string;   // 9999px
  };

  // Opacity - para camadas
  opacity: {
    disabled: string;    // 0.5
    subtle: string;      // 0.7
    medium: string;      // 0.8
    strong: string;      // 0.9
    overlay: string;     // 0.95
  };
}

class VisualTokenSystem {
  private currentTheme: 'default' | 'highContrast' | 'accessible' = 'default';

  /**
   * Tokens padrão - neon como acento
   */
  private defaultTokens: VisualTokens = {
    background: {
      primary: '#0f0f1a',
      secondary: '#1e293b',
      tertiary: '#2d3748',
      overlay: 'rgba(15,15,26,0.95)'
    },
    text: {
      primary: '#f8fafc',
      secondary: '#94a3b8',
      tertiary: '#64748b',
      inverse: '#000000'
    },
    accent: {
      primary: '#8b5cf6',
      secondary: '#06b6d4',
      success: '#10b981',
      warning: '#f59e0b',
      error: '#ef4444',
      info: '#3b82f6'
    },
    neon: {
      primary: '#00FFFF',
      secondary: '#FFD700',
      success: '#00FF88',
      warning: '#FFFF00',
      error: '#FF4444'
    },
    border: {
      subtle: '#334155',
      medium: '#475569',
      strong: '#64748b',
      accent: '#8b5cf6'
    },
    shadow: {
      subtle: '0 1px 2px rgba(0,0,0,0.1)',
      medium: '0 4px 6px rgba(0,0,0,0.1)',
      strong: '0 10px 15px rgba(0,0,0,0.1)',
      glow: '0 0 20px rgba(139,92,246,0.3)'
    },
    spacing: {
      xs: '0.25rem',
      sm: '0.5rem',
      md: '1rem',
      lg: '1.5rem',
      xl: '2rem',
      '2xl': '3rem'
    },
    radius: {
      none: '0',
      sm: '0.25rem',
      md: '0.5rem',
      lg: '0.75rem',
      xl: '1rem',
      full: '9999px'
    },
    opacity: {
      disabled: '0.5',
      subtle: '0.7',
      medium: '0.8',
      strong: '0.9',
      overlay: '0.95'
    }
  };

  /**
   * Tema de alto contraste
   */
  private highContrastTokens: VisualTokens = {
    ...this.defaultTokens,
    background: {
      primary: '#000000',
      secondary: '#111111',
      tertiary: '#222222',
      overlay: 'rgba(0,0,0,0.98)'
    },
    text: {
      primary: '#ffffff',
      secondary: '#cccccc',
      tertiary: '#aaaaaa',
      inverse: '#000000'
    },
    border: {
      subtle: '#ffffff',
      medium: '#ffffff',
      strong: '#ffffff',
      accent: '#FFD700'
    }
  };

  /**
   * Tema acessível
   */
  private accessibleTokens: VisualTokens = {
    ...this.defaultTokens,
    background: {
      primary: '#1a1a1a',
      secondary: '#2a2a2a',
      tertiary: '#3a3a3a',
      overlay: 'rgba(26,26,26,0.95)'
    },
    text: {
      primary: '#ffffff',
      secondary: '#e0e0e0',
      tertiary: '#c0c0c0',
      inverse: '#000000'
    },
    accent: {
      primary: '#4a90e2',
      secondary: '#50e3c2',
      success: '#7ed321',
      warning: '#f5a623',
      error: '#d0021b',
      info: '#9013fe'
    }
  };

  /**
   * Obtém tokens atuais baseados no tema
   */
  getTokens(): VisualTokens {
    switch (this.currentTheme) {
      case 'highContrast':
        return this.highContrastTokens;
      case 'accessible':
        return this.accessibleTokens;
      default:
        return this.defaultTokens;
    }
  }

  /**
   * Define o tema atual
   */
  setTheme(theme: 'default' | 'highContrast' | 'accessible'): void {
    this.currentTheme = theme;
    this.applyTokens();
  }

  /**
   * Aplica tokens no CSS
   */
  applyTokens(): void {
    const tokens = this.getTokens();
    const root = document.documentElement;

    // Aplicar backgrounds
    Object.entries(tokens.background).forEach(([key, value]) => {
      root.style.setProperty(`--bg-${key}`, value);
    });

    // Aplicar textos
    Object.entries(tokens.text).forEach(([key, value]) => {
      root.style.setProperty(`--text-${key}`, value);
    });

    // Aplicar accents (não neon por padrão)
    Object.entries(tokens.accent).forEach(([key, value]) => {
      root.style.setProperty(`--accent-${key}`, value);
    });

    // Aplicar neon apenas quando explicitamente solicitado
    Object.entries(tokens.neon).forEach(([key, value]) => {
      root.style.setProperty(`--neon-${key}`, value);
    });

    // Aplicar borders
    Object.entries(tokens.border).forEach(([key, value]) => {
      root.style.setProperty(`--border-${key}`, value);
    });

    // Aplicar spacing
    Object.entries(tokens.spacing).forEach(([key, value]) => {
      root.style.setProperty(`--space-${key}`, value);
    });

    // Aplicar radius
    Object.entries(tokens.radius).forEach(([key, value]) => {
      root.style.setProperty(`--radius-${key}`, value);
    });

    // Aplicar opacity
    Object.entries(tokens.opacity).forEach(([key, value]) => {
      root.style.setProperty(`--opacity-${key}`, value);
    });

    // Aplicar shadows
    Object.entries(tokens.shadow).forEach(([key, value]) => {
      root.style.setProperty(`--shadow-${key}`, value);
    });
  }

  /**
   * Classe CSS utilitária para aplicar tokens
   */
  getCssClasses(): Record<string, string> {
    const tokens = this.getTokens();

    return {
      // Backgrounds
      'bg-primary': `background-color: ${tokens.background.primary}`,
      'bg-secondary': `background-color: ${tokens.background.secondary}`,
      'bg-tertiary': `background-color: ${tokens.background.tertiary}`,
      'bg-overlay': `background-color: ${tokens.background.overlay}`,

      // Text
      'text-primary': `color: ${tokens.text.primary}`,
      'text-secondary': `color: ${tokens.text.secondary}`,
      'text-tertiary': `color: ${tokens.text.tertiary}`,

      // Accent (usar neon apenas em highlights)
      'text-accent': `color: ${tokens.accent.primary}`,
      'bg-accent': `background-color: ${tokens.accent.primary}`,
      'border-accent': `border-color: ${tokens.accent.primary}`,

      // Neon accents - usar parcamente
      'text-neon-primary': `color: ${tokens.neon.primary}; text-shadow: 0 0 10px ${tokens.neon.primary}40`,
      'text-neon-secondary': `color: ${tokens.neon.secondary}; text-shadow: 0 0 10px ${tokens.neon.secondary}40`,

      // Borders
      'border-subtle': `border-color: ${tokens.border.subtle}`,
      'border-medium': `border-color: ${tokens.border.medium}`,
      'border-accent': `border-color: ${tokens.border.accent}`,

      // Spacing utilities
      'space-xs': `margin: ${tokens.spacing.xs}`,
      'space-sm': `margin: ${tokens.spacing.sm}`,
      'space-md': `margin: ${tokens.spacing.md}`,

      // Border radius
      'rounded-sm': `border-radius: ${tokens.radius.sm}`,
      'rounded-md': `border-radius: ${tokens.radius.md}`,
      'rounded-lg': `border-radius: ${tokens.radius.lg}`,
      'rounded-full': `border-radius: ${tokens.radius.full}`,

      // Opacity
      'opacity-disabled': `opacity: ${tokens.opacity.disabled}`,
      'opacity-subtle': `opacity: ${tokens.opacity.subtle}`,
      'opacity-overlay': `opacity: ${tokens.opacity.overlay}`,

      // Shadows - usar economicamente
      'shadow-subtle': `box-shadow: ${tokens.shadow.subtle}`,
      'shadow-medium': `box-shadow: ${tokens.shadow.medium}`,
      'shadow-glow': `box-shadow: ${tokens.shadow.glow}`
    };
  }

  /**
   * Utilitários para aplicar neon apenas em destaques
   */
  applyNeonAccent(element: HTMLElement, type: keyof VisualTokens['neon'] = 'primary'): void {
    const tokens = this.getTokens();
    const neonColor = tokens.neon[type];

    element.style.color = neonColor;
    element.style.textShadow = `0 0 10px ${neonColor}40`;
    element.style.filter = `drop-shadow(0 0 5px ${neonColor}30)`;
  }

  removeNeonAccent(element: HTMLElement): void {
    element.style.color = '';
    element.style.textShadow = '';
    element.style.filter = '';
  }

  /**
   * Utilitário para destacar elementos importantes com neon sutil
   */
  highlightElement(element: HTMLElement, duration: number = 2000): void {
    this.applyNeonAccent(element, 'primary');

    setTimeout(() => {
      this.removeNeonAccent(element);
    }, duration);
  }

  /**
   * Utilitário para feedback de sucesso com neon verde
   */
  successHighlight(element: HTMLElement, duration: number = 1500): void {
    const originalColor = element.style.color;
    const originalShadow = element.style.textShadow;

    element.style.color = this.defaultTokens.neon.success;
    element.style.textShadow = `0 0 15px ${this.defaultTokens.neon.success}60`;

    setTimeout(() => {
      element.style.color = originalColor;
      element.style.textShadow = originalShadow;
    }, duration);
  }

  /**
   * Utilitário para feedback de erro com neon vermelho
   */
  errorHighlight(element: HTMLElement, duration: number = 2000): void {
    const originalColor = element.style.color;
    const originalShadow = element.style.textShadow;

    element.style.color = this.defaultTokens.neon.error;
    element.style.textShadow = `0 0 20px ${this.defaultTokens.neon.error}80`;

    setTimeout(() => {
      element.style.color = originalColor;
      element.style.textShadow = originalShadow;
    }, duration);
  }

  /**
   * Verifica se um elemento deve ter destaque neon
   */
  shouldHaveNeonHighlight(elementType: string, context: string): boolean {
    const highlightRules = {
      // Botões primários de ação
      'button-primary': true,
      'button-cta': true,

      // Elementos de progresso
      'progress-bar': true,
      'level-indicator': true,

      // Estados especiais
      'success-message': true,
      'achievement-unlocked': true,

      // Destaques contextuais
      'current-section': context === 'performance',
      'active-chord': context === 'learning',

      // Default: não usar neon
      'default': false
    };

    return highlightRules[elementType as keyof typeof highlightRules] || false;
  }

  /**
   * Obtém o tema atual
   */
  getCurrentTheme(): string {
    return this.currentTheme;
  }

  /**
   * Reseta para tema padrão
   */
  resetToDefault(): void {
    this.currentTheme = 'default';
    this.applyTokens();
  }
}

export const visualTokenSystem = new VisualTokenSystem();
