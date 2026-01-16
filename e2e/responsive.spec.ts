import { test, expect } from '@playwright/test';

/**
 * Tests E2E de responsive design
 */
test.describe('Responsive Design', () => {
  test('should be responsive on mobile viewport', async ({ page }) => {
    // Simuler un mobile
    await page.setViewportSize({ width: 375, height: 667 }); // iPhone SE
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Vérifier que la page se charge correctement
    await expect(page.locator('body')).toBeVisible();
    
    // Vérifier que le formulaire est visible
    const riotIdInput = page.locator('#riot-id');
    await expect(riotIdInput).toBeVisible();
    
    // Vérifier que le bouton est accessible
    const submitButton = page.locator('button[type="submit"]');
    await expect(submitButton).toBeVisible();
  });

  test('should be responsive on tablet viewport', async ({ page }) => {
    // Simuler une tablette
    await page.setViewportSize({ width: 768, height: 1024 }); // iPad
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Vérifier que la page se charge correctement
    await expect(page.locator('body')).toBeVisible();
    
    // Vérifier que les éléments sont bien disposés
    const riotIdInput = page.locator('#riot-id');
    await expect(riotIdInput).toBeVisible();
  });

  test('should be responsive on desktop viewport', async ({ page }) => {
    // Simuler un desktop
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Vérifier que la page se charge correctement
    await expect(page.locator('body')).toBeVisible();
    
    // Vérifier que les éléments sont bien disposés
    const riotIdInput = page.locator('#riot-id');
    await expect(riotIdInput).toBeVisible();
  });

  test('should handle viewport resize', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Commencer en desktop
    await page.setViewportSize({ width: 1920, height: 1080 });
    await expect(page.locator('#riot-id')).toBeVisible();
    
    // Redimensionner en mobile
    await page.setViewportSize({ width: 375, height: 667 });
    await expect(page.locator('#riot-id')).toBeVisible();
    
    // Redimensionner en tablette
    await page.setViewportSize({ width: 768, height: 1024 });
    await expect(page.locator('#riot-id')).toBeVisible();
  });
});
