import { expect, test } from '@playwright/test';

async function openHydroPanel(page) {
  await page.goto('/');
  await page.waitForSelector('#hydrosim-trigger', { timeout: 60000 });
  await page.click('#hydrosim-trigger');
  await page.waitForSelector('#hydrosim-panel.visible');
}

async function setScenario(page, scenario) {
  await page.selectOption('#hs-profile', scenario.profile);
  await page.selectOption('#hs-mode', scenario.mode);
  await page.evaluate(({ volume, durationMin, speed, measureLevel }) => {
    const setRange = (id, value) => {
      const el = document.querySelector(id);
      if (!el) return;
      el.value = String(value);
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
    };
    setRange('#hs-volume', volume);
    setRange('#hs-duration', durationMin);
    setRange('#hs-speed', speed);
    setRange('#hs-measure-level', measureLevel);
  }, scenario);

  await page.setChecked('#hs-measure-pump', !!scenario.pump);
  await page.setChecked('#hs-measure-dike', !!scenario.dike);
  await page.setChecked('#hs-measure-retention', !!scenario.retention);
}

async function setCameraHeight(page, targetHeightM) {
  await page.evaluate(async (targetHeight) => {
    const scene = window.HydroSim?.getScene?.();
    if (!scene || !window.Cesium) return;
    const center = scene.camera.positionCartographic;
    scene.camera.setView({
      destination: window.Cesium.Cartesian3.fromRadians(
        center.longitude,
        center.latitude,
        targetHeight
      )
    });
    await new Promise(resolve => setTimeout(resolve, 300));
  }, targetHeightM);
}

async function setCameraByLocation(page, lon, lat, height) {
  await page.evaluate(async ({ lon, lat, height }) => {
    const scene = window.HydroSim?.getScene?.();
    if (!scene || !window.Cesium) return;
    scene.camera.flyTo({
      destination: window.Cesium.Cartesian3.fromDegrees(lon, lat, height),
      duration: 0.2
    });
    await new Promise(resolve => setTimeout(resolve, 500));
  }, { lon, lat, height });
}

const scenarios = [
  {
    name: 'hannover-close-quick-advanced',
    lon: 9.74,
    lat: 52.37,
    profile: 'advanced',
    mode: 'flash',
    volume: 350000,
    durationMin: 20,
    speed: 24,
    pump: true,
    dike: true,
    retention: false,
    measureLevel: 80,
    cameraHeight: 1800
  },
  {
    name: 'hannover-far-slow-standard',
    lon: 9.74,
    lat: 52.37,
    profile: 'standard',
    mode: 'auto',
    volume: 90000,
    durationMin: 90,
    speed: 4,
    pump: false,
    dike: false,
    retention: true,
    measureLevel: 45,
    cameraHeight: 12000
  },
  {
    name: 'harz-close-quick-advanced',
    lon: 10.6,
    lat: 51.75,
    profile: 'advanced',
    mode: 'river',
    volume: 650000,
    durationMin: 25,
    speed: 32,
    pump: true,
    dike: false,
    retention: true,
    measureLevel: 75,
    cameraHeight: 2200
  },
  {
    name: 'harz-far-slow-standard',
    lon: 10.6,
    lat: 51.75,
    profile: 'standard',
    mode: 'rain',
    volume: 50000,
    durationMin: 120,
    speed: 3,
    pump: false,
    dike: true,
    retention: false,
    measureLevel: 40,
    cameraHeight: 15000
  }
];

test.describe('HydroSim advanced-mode and scenario coverage', () => {
  test('gate changes with far vs close camera', async ({ page }) => {
    await openHydroPanel(page);

    await setCameraHeight(page, 16000);
    await expect(page.locator('#hs-draw-btn')).toBeDisabled();

    await setCameraHeight(page, 1800);
    await expect(page.locator('#hs-draw-btn')).toBeEnabled();
  });

  for (const scenario of scenarios) {
    test(`scenario-controls-${scenario.name}`, async ({ page }) => {
      await openHydroPanel(page);
      await setCameraByLocation(page, scenario.lon, scenario.lat, scenario.cameraHeight);
      await setScenario(page, scenario);

      await expect(page.locator('#hs-profile')).toHaveValue(scenario.profile);
      await expect(page.locator('#hs-mode')).toHaveValue(scenario.mode);
      await expect(page.locator('#hs-speed-val')).toHaveText(String(scenario.speed));

      const qualityText = await page.locator('#hs-quality-note').innerText();
      expect(qualityText.length).toBeGreaterThan(10);
    });
  }

  test('advanced features: layer strategy and export button state', async ({ page }) => {
    await openHydroPanel(page);
    await page.selectOption('#hs-layer-strategy', 'append');
    await expect(page.locator('#hs-layer-strategy')).toHaveValue('append');
    await page.selectOption('#hs-layer-strategy', 'new');
    await expect(page.locator('#hs-layer-strategy')).toHaveValue('new');

    await expect(page.locator('#hs-export-geojson')).toBeDisabled();
    await page.click('#hs-reset');
    await expect(page.locator('#hs-export-geojson')).toBeDisabled();
  });
});
