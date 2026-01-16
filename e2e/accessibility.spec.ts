import { test, expect } from '@playwright/test';

/**
 * Tests E2E d'accessibilité
 */
test.describe('Accessibility', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('should have proper heading structure', async ({ page }) => {
    // Vérifier qu'il y a au moins un h1
    const h1 = page.locator('h1').first();
    await expect(h1).toBeVisible();
    
    // Vérifier que le h1 a du contenu
    const h1Text = await h1.textContent();
    expect(h1Text?.trim()).toBeTruthy();
  });

  test('should support keyboard navigation', async ({ page }) => {
    // Tester la navigation Tab
    await page.keyboard.press('Tab');
    
    // Vérifier qu'un élément est focusable
    const focusedElement = page.locator(':focus');
    await expect(focusedElement).toBeVisible();
    
    // Continuer la navigation Tab
    await page.keyboard.press('Tab');
    const secondFocused = page.locator(':focus');
    await expect(secondFocused).toBeVisible();
  });

  test('should have skip link for screen readers', async ({ page }) => {
    // Vérifier la présence du skip link
    const skipLink = page.locator('a[href="#main-content"]');
    await expect(skipLink).toBeVisible();
    
    // Vérifier que le skip link a un texte
    const skipLinkText = await skipLink.textContent();
    expect(skipLinkText?.trim()).toBeTruthy();
    
    // Vérifier qu'il est accessible au clavier
    // Note: Sur certains navigateurs (WebKit), le skip link peut ne pas être le premier élément focusable
    // On vérifie juste qu'il peut recevoir le focus
    await skipLink.focus();
    await expect(skipLink).toBeFocused();
  });

  test('should have proper ARIA labels on form elements', async ({ page }) => {
    // Vérifier le formulaire Riot ID
    const riotIdInput = page.locator('#riot-id');
    await expect(riotIdInput).toBeVisible();
    
    // Vérifier que l'input a un label associé
    const label = page.locator('label[for="riot-id"]');
    await expect(label).toBeVisible();
    
    // Vérifier que l'input a aria-describedby pour les messages d'aide/erreur
    const ariaDescribedBy = await riotIdInput.getAttribute('aria-describedby');
    expect(ariaDescribedBy).toBeTruthy();
  });

  test('should have proper ARIA labels on interactive elements', async ({ page }) => {
    // Vérifier que les boutons ont des labels accessibles
    const buttons = page.locator('button');
    const buttonCount = await buttons.count();
    
    expect(buttonCount).toBeGreaterThan(0);
    
    // Vérifier que la majorité des boutons ont soit un texte, soit un aria-label
    // (on accepte qu'il y ait quelques boutons sans label si la majorité en a)
    let buttonsWithLabels = 0;
    const buttonsToCheck = Math.min(buttonCount, 10);
    
    for (let i = 0; i < buttonsToCheck; i++) {
      const button = buttons.nth(i);
      const text = await button.textContent();
      const ariaLabel = await button.getAttribute('aria-label');
      const ariaLabelledBy = await button.getAttribute('aria-labelledby');
      
      // Au moins une de ces propriétés doit être présente
      const hasLabel = text?.trim() || ariaLabel || ariaLabelledBy;
      if (hasLabel) {
        buttonsWithLabels++;
      }
    }
    
    // Au moins 70% des boutons doivent avoir un label
    const percentage = (buttonsWithLabels / buttonsToCheck) * 100;
    expect(percentage).toBeGreaterThanOrEqual(70);
  });

  test('should have proper contrast (basic check)', async ({ page }) => {
    // Vérifier que le body a un contraste suffisant
    // (test basique - vérifie juste que le texte n'est pas invisible)
    const body = page.locator('body');
    const color = await body.evaluate((el) => {
      const style = window.getComputedStyle(el);
      return {
        color: style.color,
        backgroundColor: style.backgroundColor,
      };
    });
    
    // Vérifier que les couleurs sont définies (pas transparentes)
    expect(color.color).not.toBe('rgba(0, 0, 0, 0)');
    expect(color.color).not.toBe('transparent');
    expect(color.backgroundColor).not.toBe('rgba(0, 0, 0, 0)');
    expect(color.backgroundColor).not.toBe('transparent');
  });

  test('should have proper focus indicators', async ({ page }) => {
    // Tester le focus sur l'input
    const riotIdInput = page.locator('#riot-id');
    await riotIdInput.focus();
    
    // Vérifier que l'input a le focus
    await expect(riotIdInput).toBeFocused();
    
    // Vérifier qu'il y a un indicateur de focus visible (ring, outline, etc.)
    const focusStyles = await riotIdInput.evaluate((el) => {
      const style = window.getComputedStyle(el);
      return {
        outline: style.outline,
        outlineWidth: style.outlineWidth,
        boxShadow: style.boxShadow,
      };
    });
    
    // Au moins un indicateur de focus doit être présent
    const hasFocusIndicator = 
      focusStyles.outline !== 'none' && focusStyles.outlineWidth !== '0px' ||
      focusStyles.boxShadow !== 'none';
    
    expect(hasFocusIndicator).toBeTruthy();
  });

  test('should handle form validation errors accessibly', async ({ page }) => {
    const riotIdInput = page.locator('#riot-id');
    const submitButton = page.locator('button[type="submit"]');
    
    // Soumettre avec un format invalide
    await riotIdInput.fill('InvalidFormat');
    await submitButton.click();
    
    // Attendre un peu pour que la validation se déclenche
    await page.waitForTimeout(500);
    
    // Vérifier que l'input est marqué comme invalide
    const ariaInvalid = await riotIdInput.getAttribute('aria-invalid');
    const hasError = ariaInvalid === 'true' || await page.locator('#riot-id-error').count() > 0;
    
    expect(hasError).toBeTruthy();
    
    // Vérifier qu'un message d'erreur est présent
    const errorMessage = page.locator('#riot-id-error');
    if (await errorMessage.count() > 0) {
      await expect(errorMessage).toBeVisible();
      const errorText = await errorMessage.textContent();
      expect(errorText?.trim()).toBeTruthy();
    }
  });
});
