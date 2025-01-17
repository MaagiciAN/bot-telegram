const { Telegraf, Markup } = require('telegraf');
const fs = require('fs').promises;
const path = require('path');
require('dotenv').config();

// Вставте свій токен від BotFather
const bot = new Telegraf(process.env.BOT_TOKEN);

// Функція для читання даних з JSON-файлу
async function readProducts() {
  try {
    const data = await fs.readFile('products.json', 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Помилка при читанні файлу:', error);
  }
}

// Встановити команду /shop у меню команд
bot.telegram.setMyCommands([
  { command: 'shop', description: 'Показати список товарів' }
]);

bot.start((ctx) => {
  ctx.reply('Ласкаво просимо! Тут ви можете замовити свої електронні сигарети, а також насолодитися новими смаками😮‍💨🥳');
});

bot.command('shop', async (ctx) => {
  try {
    const products = await readProducts();
    const productButtons = products.map(product => 
      Markup.button.callback(`${product.name}`, `buy_${product.name}`)
    );
    
    ctx.reply('✅Доступні товари:', Markup.inlineKeyboard(productButtons, { columns: 1 }).resize());
  } catch (error) {
    console.error('Помилка при завантаженні товарів:', error);
    ctx.reply('Сталася помилка. Спробуйте пізніше.');
  }
});

(async () => {
  try {
    const products = await readProducts();
    products.forEach(product => {
      bot.action(`buy_${product.name}`, async (ctx) => {
        try {
          const products = await readProducts();
          const currentProduct = products.find(p => p.name === product.name);
          
          if (currentProduct.stock > 0) {
            const flavorList = currentProduct.flavors.map(flavor => `- ${flavor}`).join('\n');
            const imagePath = path.resolve(__dirname, currentProduct.image); // абсолютний шлях до зображення
            
            await ctx.replyWithPhoto({ source: imagePath }, {
              caption: `${currentProduct.name}\nДоступні смаки 👇🏻\n${flavorList}`
            });
            await ctx.reply(`Ціна - ${currentProduct.price} грн 💵\n\nДля замовлення оптом пишіть менеджеру в телеграм @Manager_Poof331`);
            await ctx.reply(`Ви обрали ${currentProduct.name}. Введіть кількість для замовлення🤔:`);
            
            bot.on('text', async (ctx) => {
              const quantity = parseInt(ctx.message.text);
              if (quantity > 0 && quantity <= currentProduct.stock) {
                await ctx.reply('Зв\'яжіться з менеджером для завершення замовлення або поверніться до вибору товару:', 
                  Markup.inlineKeyboard([
                    Markup.button.url('Зв\'язатися з менеджером👤', 'https://t.me/Manager_Poof331'),
                    Markup.button.callback('Повернутись до вибору товару⬅️', 'return_to_shop')
                  ], { columns: 1 }).resize()
                );
              } else {
                await ctx.reply('Некоректна кількість або недостатньо товару на складі.');
              }
            });
          } else {
            await ctx.reply(`${currentProduct.name} наразі відсутній на складі.`);
          }
        } catch (error) {
          console.error('Помилка при обробці дії покупки:', error);
          ctx.reply('Сталася помилка при обробці вашого запиту. Спробуйте пізніше.');
        }
      });
    });
  } catch (error) {
    console.error('Помилка при завантаженні товарів:', error);
  }
})();

bot.action('return_to_shop', async (ctx) => {
  await ctx.answerCbQuery();
  await ctx.reply('Повертаємо вас до вибору товарів...');
  try {
    const products = await readProducts();
    const productButtons = products.map(product => 
      Markup.button.callback(`${product.name}`, `buy_${product.name}`)
    );
    
    await ctx.reply('Доступні товари:', Markup.inlineKeyboard(productButtons, { columns: 1 }).resize());
  } catch (error) {
    console.error('Помилка при завантаженні товарів:', error);
    ctx.reply('Сталася помилка при завантаженні товарів. Спробуйте пізніше.');
  }
});

bot.launch();
console.log('Бот запущений!!');

// https://www.amevape.com/wp-content/uploads/2024/05/HM021-12.jpg
// https://www.amevape.com/wp-content/uploads/2024/01/%E7%94%B5%E5%AD%90%E7%83%9F21.4psd-500x500.jpg
// 7216155455:AAEiQ_Lvu1Sw7LUSweKUdPNgbBswAqTZnGw




