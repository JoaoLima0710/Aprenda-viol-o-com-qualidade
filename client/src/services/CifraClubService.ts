/**
 * Cifra Club Integration Service
 * Fornece links externos para cifras completas no Cifra Club
 */

export interface CifraClubLink {
  songId: string;
  title: string;
  artist: string;
  url: string;
  available: boolean;
}

class CifraClubService {
  private readonly BASE_URL = 'https://www.cifraclub.com.br';

  /**
   * Gera URL do Cifra Club para uma música
   */
  generateCifraClubUrl(artist: string, title: string): string {
    // Normalizar strings para URL
    const normalizedArtist = this.normalizeForUrl(artist);
    const normalizedTitle = this.normalizeForUrl(title);
    
    return `${this.BASE_URL}/${normalizedArtist}/${normalizedTitle}/`;
  }

  /**
   * Normaliza string para URL (remove acentos, espaços, etc)
   */
  private normalizeForUrl(text: string): string {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove acentos
      .replace(/[^a-z0-9\s-]/g, '') // Remove caracteres especiais
      .replace(/\s+/g, '-') // Substitui espaços por hífens
      .replace(/-+/g, '-') // Remove hífens duplicados
      .trim();
  }

  /**
   * Obtém informações de link para uma música
   */
  getCifraClubLink(songId: string, title: string, artist: string): CifraClubLink {
    const url = this.generateCifraClubUrl(artist, title);
    
    return {
      songId,
      title,
      artist,
      url,
      available: true, // Assumimos que está disponível
    };
  }

  /**
   * Abre cifra no Cifra Club em nova aba
   */
  openCifraClub(artist: string, title: string): void {
    const url = this.generateCifraClubUrl(artist, title);
    window.open(url, '_blank', 'noopener,noreferrer');
  }

  /**
   * Busca alternativa: Vagalume
   */
  getVagalumeUrl(artist: string, title: string): string {
    const normalizedArtist = this.normalizeForUrl(artist);
    const normalizedTitle = this.normalizeForUrl(title);
    
    return `https://www.vagalume.com.br/${normalizedArtist}/${normalizedTitle}.html`;
  }

  /**
   * Busca alternativa: Letras.mus.br
   */
  getLetrasMusicUrl(artist: string, title: string): string {
    const normalizedArtist = this.normalizeForUrl(artist);
    const normalizedTitle = this.normalizeForUrl(title);
    
    return `https://www.letras.mus.br/${normalizedArtist}/${normalizedTitle}/`;
  }

  /**
   * Obtém múltiplas fontes de cifras
   */
  getAllSources(artist: string, title: string): {
    cifraClub: string;
    vagalume: string;
    letrasMusic: string;
  } {
    return {
      cifraClub: this.generateCifraClubUrl(artist, title),
      vagalume: this.getVagalumeUrl(artist, title),
      letrasMusic: this.getLetrasMusicUrl(artist, title),
    };
  }
}

export const cifraClubService = new CifraClubService();
