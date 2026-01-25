import { test, expect } from '@playwright/test';

/**
 * Teste E2E: Áudio só toca após gesto do usuário
 * 
 * Verifica que o áudio só é ativado após o usuário clicar no botão "Ativar áudio".
 * 
 * OBJETIVO:
 * - Garantir conformidade com políticas de autoplay dos navegadores
 * - Verificar que áudio não toca automaticamente
 * - Confirmar que interação do usuário é necessária
 */

test('audio only plays after user gesture', async ({ page }) => {
  // Navegar para a página inicial
  await page.goto('/');

  // Verificar que o botão "Ativar áudio" está presente
  const activateButton = page.getByText('Ativar Áudio');
  await expect(activateButton).toBeVisible();

  // Verificar que o indicador de áudio tocando NÃO está visível antes do clique
  const audioPlayingBefore = page.locator('[data-testid="audio-playing"]');
  await expect(audioPlayingBefore).not.toBeVisible();

  // Clicar no botão "Ativar áudio"
  await activateButton.click();

  // Aguardar e verificar que o indicador de áudio tocando está visível
  const audioPlaying = page.locator('[data-testid="audio-playing"]');
  await expect(audioPlaying).toBeVisible();
});

test('audio does not play automatically on page load', async ({ page }) => {
  // Navegar para a página inicial
  await page.goto('/');

  // Aguardar um pouco para garantir que não há autoplay
  await page.waitForTimeout(1000);

  // Verificar que o indicador de áudio tocando NÃO está visível sem interação
  const audioPlaying = page.locator('[data-testid="audio-playing"]');
  await expect(audioPlaying).not.toBeVisible();

  // Verificar que o botão "Ativar áudio" está presente
  const activateButton = page.getByText('Ativar Áudio');
  await expect(activateButton).toBeVisible();
});
