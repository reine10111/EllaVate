class InventoryPage {
  constructor(page) {
    this.page = page;
    this.title = page.locator('.title');
    this.cartLink = page.locator('.shopping_cart_link');
    this.cartBadge = page.locator('.shopping_cart_badge');
  }

  async addToCart(productSlug) {
    // e.g. 'sauce-labs-backpack'
    await this.page.click(`[data-test="add-to-cart-${productSlug}"]`);
  }

  async openCart() {
    await this.cartLink.click();
  }
}

module.exports = { InventoryPage };