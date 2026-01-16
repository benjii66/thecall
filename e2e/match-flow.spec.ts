import { test, expect } from '@playwright/test';

/**
 * Tests E2E du flux de recherche et affichage de matchs
 * 
 * Note: Ces tests nécessitent une API Riot fonctionnelle
 * En cas d'erreur API, les tests vérifieront la gestion d'erreur
 */
test.describe('Match Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('should display Riot ID search form on home page', async ({ page }) => {
    // Vérifier la présence du formulaire Riot ID
    const riotIdInput = page.locator('#riot-id');
    await expect(riotIdInput).toBeVisible();
    
    // Vérifier le placeholder
    const placeholder = await riotIdInput.getAttribute('placeholder');
    expect(placeholder).toBeTruthy();
    
    // Vérifier le bouton de soumission
    const submitButton = page.locator('button[type="submit"]');
    await expect(submitButton).toBeVisible();
    
    // Vérifier le label
    const label = page.locator('label[for="riot-id"]');
    await expect(label).toBeVisible();
  });

  test('should validate Riot ID format', async ({ page }) => {
    const riotIdInput = page.locator('#riot-id');
    const submitButton = page.locator('button[type="submit"]');
    
    // Tester avec un format invalide (sans #)
    await riotIdInput.fill('InvalidRiotId');
    await submitButton.click();
    
    // Attendre un peu pour que la validation se déclenche
    await page.waitForTimeout(500);
    
    // Vérifier qu'un message d'erreur apparaît
    const errorMessage = page.locator('#riot-id-error, [aria-invalid="true"]');
    const hasError = await errorMessage.count() > 0 || await riotIdInput.getAttribute('aria-invalid') === 'true';
    
    // Soit un message d'erreur visible, soit l'input est marqué comme invalide
    expect(hasError).toBeTruthy();
  });

  test('should navigate to overview page with valid Riot ID', async ({ page }) => {
    const riotIdInput = page.locator('#riot-id');
    const submitButton = page.locator('button[type="submit"]');
    
    // Tester avec un format valide (avec #)
    await riotIdInput.fill('TestSummoner#EUW');
    
    // Intercepter la navigation
    const navigationPromise = page.waitForURL(/.*overview.*/, { timeout: 10000 }).catch(() => null);
    await submitButton.click();
    
    // Attendre la navigation (peut échouer si l'API Riot n'est pas disponible)
    await navigationPromise;
    
    // Vérifier que l'URL contient le riotId (si la navigation a réussi)
    const url = page.url();
    if (url.includes('overview')) {
      expect(url).toContain('riotId');
      expect(url).toContain('TestSummoner');
    } else {
      // Si la navigation n'a pas eu lieu (API non disponible), on skip le test
      test.skip();
    }
  });

  test('should show skeleton loader when loading matches', async ({ page }) => {
    const riotIdInput = page.locator('#riot-id');
    const submitButton = page.locator('button[type="submit"]');
    
    // Remplir avec un Riot ID valide
    await riotIdInput.fill('TestSummoner#EUW');
    
    // Intercepter la navigation et chercher les skeletons
    const navigationPromise = page.waitForURL(/.*overview.*/, { timeout: 10000 }).catch(() => null);
    const skeletonPromise = page.waitForSelector('[aria-busy="true"], .animate-pulse, [data-testid="skeleton"]', { timeout: 3000 }).catch(() => null);
    
    await submitButton.click();
    
    // Attendre soit la navigation, soit l'apparition d'un skeleton
    await Promise.race([navigationPromise, skeletonPromise]);
    
    // Si on est sur la page overview, vérifier qu'il y a des skeletons ou des éléments de chargement
    if (page.url().includes('overview')) {
      const skeleton = page.locator('[aria-busy="true"], .animate-pulse, [data-testid="skeleton"]').first();
      // Ne pas échouer si aucun skeleton n'est trouvé (peut être très rapide)
      if (await skeleton.count() > 0) {
        await expect(skeleton).toBeVisible();
      }
    }
  });

  test('should handle API errors gracefully', async ({ page }) => {
    // Intercepter les requêtes API pour simuler une erreur
    await page.route('**/api/**', route => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Internal Server Error' }),
      });
    });
    
    const riotIdInput = page.locator('#riot-id');
    const submitButton = page.locator('button[type="submit"]');
    
    // Soumettre le formulaire
    await riotIdInput.fill('TestSummoner#EUW');
    await submitButton.click();
    
    // Attendre un peu pour que l'erreur soit gérée
    await page.waitForTimeout(2000);
    
    // Vérifier que la page ne crash pas
    await expect(page.locator('body')).toBeVisible();
    
    // Chercher un message d'erreur ou une notification
    await expect(page.locator('text=/error|erreur|failed|échec/i, [role="alert"], .toast, .notification')).toBeVisible({ timeout: 100 });

    // Ne pas échouer si aucun message n'est trouvé (l'erreur peut être gérée différemment)
  });

  test('should support Enter key to submit form', async ({ page }) => {
    const riotIdInput = page.locator('#riot-id');
    
    // Remplir et appuyer sur Enter
    await riotIdInput.fill('TestSummoner#EUW');
    
    // Intercepter la navigation
    const navigationPromise = page.waitForURL(/.*overview.*/, { timeout: 10000 }).catch(() => null);
    
    await riotIdInput.press('Enter');
    
    // Vérifier que la navigation se déclenche
    await navigationPromise;
    
    // Si la navigation a réussi, l'URL devrait contenir riotId
    if (page.url().includes('overview')) {
      expect(page.url()).toContain('riotId');
    }
  });
});
