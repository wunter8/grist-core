import { assert, driver, Key } from 'mocha-webdriver';
import * as gu from 'test/nbrowser/gristUtils';
import { setupTestSuite } from 'test/nbrowser/testUtils';


describe('DescriptionWidget', function() {
  this.timeout(20000);
  const cleanup = setupTestSuite();

  it('should support basic edition in right panel', async () => {
    const mainSession = await gu.session().teamSite.login();
    await mainSession.tempDoc(cleanup, "CardView.grist", { load: true });

    const newWidgetDesc = "This is the widget description\nIt is in two lines";
    await driver.find('.test-right-opener').click();
    // Sleep 100ms to let open the right panel and make the description input clickable
    await driver.sleep(100);
    const rightPanelDescriptionInput = await driver.find('.test-right-panel .test-right-widget-description');
    await rightPanelDescriptionInput.click();
    await rightPanelDescriptionInput.sendKeys(newWidgetDesc);
    // Click on other input to unselect descriptionInput
    await driver.find('.test-right-panel .test-right-widget-title').click();
    await checkDescValueInWidgetTooltip("Table", newWidgetDesc);
  });

  it('should support basic edition in widget popup', async () => {
    const mainSession = await gu.session().teamSite.login();
    await mainSession.tempDoc(cleanup, "CardView.grist", { load: true });

    const widgetName = "Table";
    const newWidgetDescFirstLine = "First line of the description";
    const newWidgetDescSecondLine = "Second line of the description";

    await addWidgetDescription(widgetName, newWidgetDescFirstLine, newWidgetDescSecondLine);
    await checkDescValueInWidgetTooltip(widgetName, `${newWidgetDescFirstLine}\n${newWidgetDescSecondLine}`);
  });

  it('should show info tooltip only if there is a description', async () => {
    const mainSession = await gu.session().teamSite.login();
    await mainSession.tempDoc(cleanup, "CardView.grist", { load: true });

    const newWidgetDesc = "New description for widget Table";

    await addWidgetDescription("Table", newWidgetDesc);

    assert.isFalse(await getWidgetTooltip("Single card").isPresent());
    assert.isTrue(await getWidgetTooltip("Table").isPresent());

    await checkDescValueInWidgetTooltip("Table", newWidgetDesc);
  });
});

async function waitForEditPopup() {
  await gu.waitToPass(async () => {
    assert.isTrue(await driver.find(".test-widget-title-popup").isDisplayed());
  });
}

async function waitForTooltip() {
  await gu.waitToPass(async () => {
    assert.isTrue(await driver.find(".test-widget-info-tooltip-popup").isDisplayed());
  });
}

function getWidgetTitle(widgetName: string) {
  return driver.findContent('.test-widget-title-text', `${widgetName}`);
}

function getWidgetTooltip(widgetName: string) {
  return getWidgetTitle(widgetName).findClosest(".test-viewsection-title").find(".test-widget-info-tooltip");
}

async function addWidgetDescription(widgetName: string, desc: string, descSecondLine: string = "") {
  // Click on the title and open the edition popup
  await getWidgetTitle(widgetName).click();
  await waitForEditPopup();
  const widgetEditPopup = await driver.find('.test-widget-title-popup');
  const widgetDescInput = await widgetEditPopup.find('.test-widget-title-section-description-input');

  // Edit the description of the widget inside the popup
  await widgetDescInput.click();
  await widgetDescInput.sendKeys(desc);
  if (descSecondLine !== "") {
    await widgetDescInput.sendKeys(Key.ENTER, descSecondLine);
  }
  await widgetDescInput.sendKeys(Key.CONTROL, Key.ENTER);
  await gu.waitForServer();
}

async function checkDescValueInWidgetTooltip(widgetName: string, desc: string) {
  await getWidgetTooltip(widgetName).click();
  await waitForTooltip();
  const descriptionTooltip = await driver
    .find('.test-widget-info-tooltip-popup');
  assert.equal(await descriptionTooltip.getText(), desc);
}
