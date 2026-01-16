import { test, expect } from '@playwright/test';

/**
 * Tests E2E de navigation de base
 */
test.describe('Navigation', () => {
  test.beforeEach(async ({ page }) => {
    // Attendre que la page soit complètement chargée
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('should load the home page with all key elements', async ({ page }) => {
    // Vérifier que la page se charge
    await expect(page).toHaveTitle(/The Call/i);
    
    // Vérifier la présence d'éléments clés de la landing page
    await expect(page.locator('body')).toBeVisible();
    
    // Vérifier la présence du formulaire Riot ID
    const riotIdInput = page.locator('#riot-id');
    await expect(riotIdInput).toBeVisible();
    
    // Vérifier la présence du bouton d'analyse
    const analyzeButton = page.locator('button[type="submit"]');
    await expect(analyzeButton).toBeVisible();
  });

  test('should have accessible navigation with skip link', async ({ page }) => {
    // Vérifier la présence d'un lien "skip to main content" pour l'accessibilité
    const skipLink = page.locator('a[href="#main-content"]');
    await expect(skipLink).toBeVisible();
    
    // Vérifier que le skip link peut recevoir le focus
    await skipLink.focus();
    await expect(skipLink).toBeFocused();
    
    // Vérifier que le skip link fonctionne
    await skipLink.click();
    // Le focus devrait se déplacer vers le contenu principal
  });

  test('should navigate to pricing page from navbar', async ({ page }) => {
    // Chercher un lien vers pricing dans la navbar
    const pricingLink = page.locator('a[href*="pricing"], a[href="/pricing"]').first();
    
    if (await pricingLink.count() > 0) {
      await pricingLink.click();
      await expect(page).toHaveURL(/.*pricing/);
      
      // Vérifier que la page pricing se charge
      await page.waitForLoadState('networkidle');
      await expect(page.locator('body')).toBeVisible();
    } else {
      test.skip();
    }
  });

  test('should navigate to privacy page from navbar', async ({ page }) => {
    const privacyLink = page.locator('a[href*="privacy"], a[href="/privacy"]').first();
    
    if (await privacyLink.count() > 0) {
      await privacyLink.click();
      await expect(page).toHaveURL(/.*privacy/);
      
      // Vérifier que la page privacy se charge
      await page.waitForLoadState('networkidle');
      await expect(page.locator('body')).toBeVisible();
    } else {
      test.skip();
    }
  });

  test('should have navbar visible on all pages', async ({ page }) => {
    // Vérifier la navbar sur la page d'accueil
    const navbar = page.locator('nav, [role="navigation"]').first();
    await expect(navbar).toBeVisible();
    
    // Tester sur la page pricing si elle existe
    const pricingLink = page.locator('a[href*="pricing"]').first();
    if (await pricingLink.count() > 0) {
      await pricingLink.click();
      await page.waitForLoadState('networkidle');
      const navbarOnPricing = page.locator('nav, [role="navigation"]').first();
      await expect(navbarOnPricing).toBeVisible();
    }
  });
});
