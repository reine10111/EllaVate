class LoginPage {
  constructor(page) {
    this.page = page;
    this.username = '#user-name';
    this.password = '#password';
    this.loginButton = '#login-button';
    this.errorMessage = '[data-test="error"]';
  }

  async goto() {
    await this.page.goto('/');
  }

  async login(user, pass) {
    await this.page.fill(this.username, user);
    await this.page.fill(this.password, pass);
    await this.page.click(this.loginButton);
  }

  getError() {
    return this.page.locator(this.errorMessage);
  }
}

module.exports = { LoginPage };