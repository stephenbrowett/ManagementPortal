import { $, browser, by, element } from 'protractor';

describe('Create, edit, and delete user', () => {

    const username = element(by.id('username'));
    const password = element(by.id('password'));
    const accountMenu = element(by.id('account-menu'));
    const adminMenu = element(by.id('admin-menu'));
    const login = element(by.id('login'));
    const logout = element(by.id('logout'));

    beforeAll(async () => {
        await browser.get('#');

        await accountMenu.click();
        await login.click();

        await username.sendKeys('admin');
        await password.sendKeys('admin');
        await element(by.css('button[type=submit]')).click();
        await browser.waitForAngular();
    });

    beforeEach(async () => {
        browser.sleep(1000);
    });

    it('should load user management view', async () => {
        await adminMenu.click();
        await element(by.css('[routerLink="user-management"]')).click();

        const expect1 = /userManagement.home.title/;
        const pageTitle = element.all(by.css('h2 span')).first();
        expect((await pageTitle.getAttribute('jhiTranslate'))).toMatch(expect1);
    });

    it('should load create a new user dialog', async () => {
        await element(by.cssContainingText('button.btn-primary', 'Create a new user')).click();
        const expectVal = /userManagement.home.createOrEditLabel/;

        const modalTitle = element.all(by.css('h4.modal-title')).first();
        expect((await modalTitle.getAttribute('jhiTranslate'))).toMatch(expectVal);

        await element(by.css('button.close')).click();
    });

    it('should be able to create new user with roles', async () => {
        await element(by.cssContainingText('button.btn-primary', 'Create a new user')).click();
        await element(by.name('login')).sendKeys('test-user-radar');
        await element(by.name('firstName')).sendKeys('Bob');
        await element(by.name('lastName')).sendKeys('Rob');
        await element(by.name('email')).sendKeys('rob@radarcns.org');
        await element(by.name('authority')).sendKeys('ROLE_PROJECT_ADMIN');
        await element(by.name('project')).sendKeys('radar');
        await element(by.name('addRole')).click();

        await element(by.cssContainingText('button.btn-primary', 'Save')).click();
        await browser.waitForAngular();

        expect((await element.all(by.css('jhi-user-mgmt tbody tr')).count())).toEqual(8);
    });

    it('should be able to create new system admin user', async () => {
        await element(by.cssContainingText('button.btn-primary', 'Create an admin user')).click();
        await element(by.name('login')).sendKeys('test-sys-admin');
        await element(by.name('firstName')).sendKeys('Alice');
        await element(by.name('lastName')).sendKeys('Bob');
        await element(by.name('email')).sendKeys('alice@radarcns.org');

        await element(by.cssContainingText('button.btn-primary', 'Save')).click();
        await browser.waitForAngular();
        expect((await element.all(by.css('jhi-user-mgmt tbody tr')).count())).toEqual(9);
    });

    it('should be able to edit a user with roles', async () => {
        await element.all(by.cssContainingText('jhi-user-mgmt tbody tr td', 'test-user-radar'))
            .all(by.xpath('ancestor::tr'))
            .all(by.cssContainingText('jhi-user-mgmt tbody tr button', 'Edit'))
            .first().click();
        await element(by.name('lastName')).sendKeys('Robert');
        await element(by.cssContainingText('button.btn-primary', 'Save')).click();

        await browser.waitForAngular();
        expect((await element.all(by.css('jhi-user-mgmt tbody tr')).count())).toEqual(9);
    });

    it('should be able to delete a user with roles', async () => {
        await element(by.cssContainingText('jhi-user-mgmt tbody tr td', 'test-user-radar'))
            .element(by.xpath('ancestor::tr'))
            .element(by.cssContainingText('button', 'Delete')).click();
        await browser.waitForAngular();
        await element(by.cssContainingText('jhi-user-mgmt-delete-dialog button.btn-danger', 'Delete'))
            .click();

        await browser.waitForAngular();
        expect((await element.all(by.css('jhi-user-mgmt tbody tr')).count())).toEqual(8);
    });

    it('should be able to delete a sys admin user', async () => {
        await element(by.cssContainingText('jhi-user-mgmt tbody tr td', 'test-sys-admin'))
            .element(by.xpath('ancestor::tr'))
            .element(by.cssContainingText('button', 'Delete')).click();
        await browser.waitForAngular();
        await element(by.cssContainingText('jhi-user-mgmt-delete-dialog button.btn-danger', 'Delete'))
            .click();

        await browser.waitForAngular();
        expect((await element.all(by.css('jhi-user-mgmt tbody tr')).count())).toEqual(7);
    });

    afterAll(async () => {
        await accountMenu.click();
        await logout.click();
        browser.sleep(1000);
    });
});
