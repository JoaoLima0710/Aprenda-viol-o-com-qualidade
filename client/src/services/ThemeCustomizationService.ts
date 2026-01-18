/**
 * Theme Customization Service - 2026 Edition
 * Sistema avançado de personalização visual
 */

export interface ThemeColors {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  surface: string;
  text: string;
  textSecondary: string;
  border: string;
  success: string;
  warning: string;
  error: string;
  info: string;
}

export interface ThemeConfig {
  mode: 'light' | 'dark' | 'auto';
  colors: ThemeColors;
  borderRadius: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  fontSize: 'sm' | 'md' | 'lg';
  spacing: 'compact' | 'comfortable' | 'spacious';
  animations: 'none' | 'minimal' | 'full';
}

export interface LayoutPreset {
  id: string;
  name: string;
  description: string;
  icon: string;
  dashboardLayout: 'grid' | 'list' | 'cards' | 'minimal';
  navigationStyle: 'tabs' | 'drawer' | 'bottom' | 'gesture';
  cardStyle: 'elevated' | 'outlined' | 'flat' | 'glass';
  spacing: 'compact' | 'comfortable' | 'spacious';
}

export interface UserPreferences {
  theme: ThemeConfig;
  layout: LayoutPreset;
  dashboard: {
    showStats: boolean;
    showRecent: boolean;
    showAchievements: boolean;
    showGoals: boolean;
    widgetOrder: string[];
    compactMode: boolean;
  };
  navigation: {
    gestureNavigation: boolean;
    hapticFeedback: boolean;
    autoHideNavigation: boolean;
    quickActions: string[];
  };
  accessibility: {
    highContrast: boolean;
    largeText: boolean;
    reduceMotion: boolean;
    screenReader: boolean;
  };
}

class ThemeCustomizationService {
  private readonly STORAGE_KEY = 'musictutor_theme_preferences';
  private readonly DEFAULT_LAYOUTS: LayoutPreset[] = [
    {
      id: 'modern',
      name: 'Moderno',
      description: 'Design clean com cards elevados e navegação por gestos',
      icon: '✨',
      dashboardLayout: 'cards',
      navigationStyle: 'gesture',
      cardStyle: 'elevated',
      spacing: 'comfortable'
    },
    {
      id: 'minimal',
      name: 'Minimalista',
      description: 'Interface limpa focada no essencial',
      icon: '🎯',
      dashboardLayout: 'minimal',
      navigationStyle: 'bottom',
      cardStyle: 'flat',
      spacing: 'spacious'
    },
    {
      id: 'classic',
      name: 'Clássico',
      description: 'Layout tradicional com navegação por abas',
      icon: '📱',
      dashboardLayout: 'grid',
      navigationStyle: 'tabs',
      cardStyle: 'outlined',
      spacing: 'comfortable'
    },
    {
      id: 'productivity',
      name: 'Produtividade',
      description: 'Otimizado para foco e eficiência',
      icon: '⚡',
      dashboardLayout: 'list',
      navigationStyle: 'drawer',
      cardStyle: 'elevated',
      spacing: 'compact'
    },
    {
      id: 'creative',
      name: 'Criativo',
      description: 'Design inspirador com elementos visuais ricos',
      icon: '🎨',
      dashboardLayout: 'cards',
      navigationStyle: 'gesture',
      cardStyle: 'glass',
      spacing: 'comfortable'
    }
  ];

  private readonly DEFAULT_COLOR_PALETTES = {
    ocean: {
      primary: '#0ea5e9',
      secondary: '#0284c7',
      accent: '#06b6d4',
      background: '#0f172a',
      surface: '#1e293b',
      text: '#f8fafc',
      textSecondary: '#94a3b8',
      border: '#334155',
      success: '#10b981',
      warning: '#f59e0b',
      error: '#ef4444',
      info: '#3b82f6'
    },
    sunset: {
      primary: '#f59e0b',
      secondary: '#d97706',
      accent: '#f97316',
      background: '#1c1917',
      surface: '#292524',
      text: '#fafaf9',
      textSecondary: '#a8a29e',
      border: '#57534e',
      success: '#22c55e',
      warning: '#eab308',
      error: '#ef4444',
      info: '#06b6d4'
    },
    forest: {
      primary: '#16a34a',
      secondary: '#15803d',
      accent: '#22c55e',
      background: '#0f172a',
      surface: '#1e293b',
      text: '#f8fafc',
      textSecondary: '#94a3b8',
      border: '#334155',
      success: '#10b981',
      warning: '#f59e0b',
      error: '#ef4444',
      info: '#0ea5e9'
    },
    purple: {
      primary: '#9333ea',
      secondary: '#7c3aed',
      accent: '#a855f7',
      background: '#1e1b4b',
      surface: '#312e81',
      text: '#f8fafc',
      textSecondary: '#c4b5fd',
      border: '#6366f1',
      success: '#10b981',
      warning: '#f59e0b',
      error: '#ef4444',
      info: '#06b6d4'
    },
    cyber: {
      primary: '#00ff88',
      secondary: '#00cc66',
      accent: '#00ff88',
      background: '#0a0a0a',
      surface: '#1a1a1a',
      text: '#ffffff',
      textSecondary: '#cccccc',
      border: '#333333',
      success: '#00ff88',
      warning: '#ffff00',
      error: '#ff4444',
      info: '#0088ff'
    }
  };

  /**
   * Obtém preferências do usuário
   */
  getUserPreferences(): UserPreferences {
    const saved = localStorage.getItem(this.STORAGE_KEY);
    if (saved) {
      return JSON.parse(saved);
    }

    return this.getDefaultPreferences();
  }

  /**
   * Salva preferências do usuário
   */
  saveUserPreferences(preferences: UserPreferences): void {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(preferences));
    this.applyTheme(preferences.theme);
    this.notifyThemeChange();
  }

  /**
   * Aplica tema atual
   */
  applyTheme(theme: ThemeConfig): void {
    const root = document.documentElement;

    // Aplicar variáveis CSS
    Object.entries(theme.colors).forEach(([key, value]) => {
      root.style.setProperty(`--color-${key}`, value);
    });

    // Aplicar modo
    const isDark = theme.mode === 'dark' ||
                  (theme.mode === 'auto' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    root.classList.toggle('dark', isDark);

    // Aplicar outras configurações
    root.style.setProperty('--border-radius', this.getBorderRadiusValue(theme.borderRadius));
    root.style.setProperty('--font-size-multiplier', this.getFontSizeMultiplier(theme.fontSize));
    root.style.setProperty('--spacing-multiplier', this.getSpacingMultiplier(theme.spacing));

    // Animações
    if (theme.animations === 'none') {
      root.style.setProperty('--animation-duration', '0s');
    } else if (theme.animations === 'minimal') {
      root.style.setProperty('--animation-duration', '0.1s');
    } else {
      root.style.setProperty('--animation-duration', '0.3s');
    }
  }

  /**
   * Obtém layouts disponíveis
   */
  getAvailableLayouts(): LayoutPreset[] {
    return this.DEFAULT_LAYOUTS;
  }

  /**
   * Obtém paletas de cores disponíveis
   */
  getAvailableColorPalettes(): Record<string, ThemeColors> {
    return this.DEFAULT_COLOR_PALETTES;
  }

  /**
   * Cria tema personalizado
   */
  createCustomTheme(basePalette: string, customizations: Partial<ThemeColors>): ThemeConfig {
    const baseColors = this.DEFAULT_COLOR_PALETTES[basePalette as keyof typeof this.DEFAULT_COLOR_PALETTES] ||
                      this.DEFAULT_COLOR_PALETTES.ocean;

    return {
      mode: 'dark',
      colors: { ...baseColors, ...customizations },
      borderRadius: 'md',
      fontSize: 'md',
      spacing: 'comfortable',
      animations: 'full'
    };
  }

  /**
   * Atualiza layout do usuário
   */
  updateLayout(layoutId: string): void {
    const layout = this.DEFAULT_LAYOUTS.find(l => l.id === layoutId);
    if (!layout) return;

    const preferences = this.getUserPreferences();
    preferences.layout = layout;
    this.saveUserPreferences(preferences);
  }

  /**
   * Atualiza paleta de cores
   */
  updateColorPalette(paletteName: string): void {
    const palette = this.DEFAULT_COLOR_PALETTES[paletteName as keyof typeof this.DEFAULT_COLOR_PALETTES];
    if (!palette) return;

    const preferences = this.getUserPreferences();
    preferences.theme.colors = palette;
    this.saveUserPreferences(preferences);
  }

  /**
   * Toggle modo high contrast
   */
  toggleHighContrast(enabled: boolean): void {
    const preferences = this.getUserPreferences();
    preferences.accessibility.highContrast = enabled;

    if (enabled) {
      // Aplicar cores de alto contraste
      preferences.theme.colors = {
        ...preferences.theme.colors,
        text: '#ffffff',
        textSecondary: '#cccccc',
        background: '#000000',
        surface: '#111111',
        border: '#ffffff'
      };
    } else {
      // Restaurar cores originais
      this.updateColorPalette('ocean'); // Reset para padrão
    }

    this.saveUserPreferences(preferences);
  }

  /**
   * Toggle modo compacto
   */
  toggleCompactMode(enabled: boolean): void {
    const preferences = this.getUserPreferences();
    preferences.dashboard.compactMode = enabled;
    preferences.theme.spacing = enabled ? 'compact' : 'comfortable';
    this.saveUserPreferences(preferences);
  }

  /**
   * Configura navegação gestual
   */
  setupGestureNavigation(enabled: boolean): void {
    const preferences = this.getUserPreferences();
    preferences.navigation.gestureNavigation = enabled;
    this.saveUserPreferences(preferences);

    if (enabled) {
      this.initializeGestureNavigation();
    } else {
      this.removeGestureNavigation();
    }
  }

  /**
   * Exporta configurações do usuário
   */
  exportPreferences(): string {
    const preferences = this.getUserPreferences();
    return JSON.stringify(preferences, null, 2);
  }

  /**
   * Importa configurações do usuário
   */
  importPreferences(jsonString: string): boolean {
    try {
      const preferences = JSON.parse(jsonString);
      this.saveUserPreferences(preferences);
      return true;
    } catch {
      return false;
    }
  }

  // ========== MÉTODOS PRIVADOS ==========

  private getDefaultPreferences(): UserPreferences {
    return {
      theme: {
        mode: 'dark',
        colors: this.DEFAULT_COLOR_PALETTES.ocean,
        borderRadius: 'md',
        fontSize: 'md',
        spacing: 'comfortable',
        animations: 'full'
      },
      layout: this.DEFAULT_LAYOUTS[0], // Modern
      dashboard: {
        showStats: true,
        showRecent: true,
        showAchievements: true,
        showGoals: true,
        widgetOrder: ['stats', 'recent', 'achievements', 'goals'],
        compactMode: false
      },
      navigation: {
        gestureNavigation: true,
        hapticFeedback: true,
        autoHideNavigation: false,
        quickActions: ['practice', 'songs', 'tuner']
      },
      accessibility: {
        highContrast: false,
        largeText: false,
        reduceMotion: false,
        screenReader: false
      }
    };
  }

  private getBorderRadiusValue(radius: string): string {
    const values = {
      none: '0px',
      sm: '0.25rem',
      md: '0.5rem',
      lg: '0.75rem',
      xl: '1rem'
    };
    return values[radius as keyof typeof values] || values.md;
  }

  private getFontSizeMultiplier(size: string): string {
    const multipliers = {
      sm: '0.9',
      md: '1.0',
      lg: '1.1'
    };
    return multipliers[size as keyof typeof multipliers] || multipliers.md;
  }

  private getSpacingMultiplier(spacing: string): string {
    const multipliers = {
      compact: '0.8',
      comfortable: '1.0',
      spacious: '1.2'
    };
    return multipliers[spacing as keyof typeof multipliers] || multipliers.comfortable;
  }

  private notifyThemeChange(): void {
    // Disparar evento customizado para componentes reagirem à mudança de tema
    window.dispatchEvent(new CustomEvent('themeChanged', {
      detail: this.getUserPreferences()
    }));
  }

  private initializeGestureNavigation(): void {
    let startX = 0;
    let startY = 0;

    const handleTouchStart = (e: TouchEvent) => {
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (!startX || !startY) return;

      const endX = e.changedTouches[0].clientX;
      const endY = e.changedTouches[0].clientY;

      const diffX = endX - startX;
      const diffY = endY - startY;

      // Swipe direito para voltar
      if (Math.abs(diffX) > 100 && Math.abs(diffX) > Math.abs(diffY) && diffX > 0) {
        this.handleGestureNavigation('back');
      }
      // Swipe esquerdo para avançar
      else if (Math.abs(diffX) > 100 && Math.abs(diffX) > Math.abs(diffY) && diffX < 0) {
        this.handleGestureNavigation('forward');
      }
      // Swipe para cima para menu
      else if (Math.abs(diffY) > 100 && Math.abs(diffY) > Math.abs(diffX) && diffY < 0) {
        this.handleGestureNavigation('menu');
      }
    };

    document.addEventListener('touchstart', handleTouchStart, { passive: true });
    document.addEventListener('touchend', handleTouchEnd, { passive: true });
  }

  private removeGestureNavigation(): void {
    // Remove event listeners (implementação simplificada)
    // Em produção, manter referências para remoção adequada
  }

  private handleGestureNavigation(action: 'back' | 'forward' | 'menu'): void {
    // Disparar evento para navegação gestual
    window.dispatchEvent(new CustomEvent('gestureNavigation', {
      detail: { action }
    }));

    // Haptic feedback se suportado
    if (navigator.vibrate) {
      navigator.vibrate(50);
    }
  }
}

export const themeCustomizationService = new ThemeCustomizationService();
