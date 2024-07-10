const { Telegraf, Markup } = require('telegraf');
const fs = require('fs').promises;

// Замість 'YOUR_BOT_TOKEN' вставте свій токен від BotFather
const bot = new Telegraf('7216155455:AAEiQ_Lvu1Sw7LUSweKUdPNgbBswAqTZnGw');

// Функція для читання даних з JSON-файлу
async function readProducts() {
  try {
    const data = await fs.readFile('products.json', 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Помилка читання файлу:', error);
    return [];
  }
}

// Функція для запису даних у JSON-файл
async function writeProducts(products) {
  try {
    await fs.writeFile('products.json', JSON.stringify(products, null, 2));
  } catch (error) {
    console.error('Помилка запису файлу:', error);
  }
}

// Встановити команду /shop у меню команд
bot.telegram.setMyCommands([
  { command: 'shop', description: 'Показати список товарів🛍' }
]);

bot.start((ctx) => {
  ctx.reply('Ласкаво просимо! Тут ви можете замовити свої електронні сигарети, а також насолодитися новими смаками😮‍💨');
});

bot.command('shop', async (ctx) => {
  const products = await readProducts();
  const productButtons = products.map(product => 
    Markup.button.callback(`${product.name} (${product.stock} в наявності)`, `buy_${product.name}`)
  );
  
  ctx.reply('Доступні товари:', Markup.inlineKeyboard(productButtons, { columns: 1 }).resize());
});

(async () => {
  const products = await readProducts();
  products.forEach(product => {
    bot.action(`buy_${product.name}`, async (ctx) => {
      const products = await readProducts();
      const currentProduct = products.find(p => p.name === product.name);
      
      if (currentProduct.stock > 0) {
        const flavorList = currentProduct.flavors.map(flavor => `- ${flavor}`).join('\n');
        await ctx.replyWithPhoto(currentProduct.image, {
          caption: `Доступні смаки 👇🏻\n${currentProduct.name}\n${flavorList}`
        });
        await ctx.reply(`Ціна - ${currentProduct.price} грн💵\n\nДля замовлення оптом пишіть менеджеру в телеграм @majorchamp1`);
        await ctx.reply(`Ви обрали ${currentProduct.name}. Введіть кількість для замовлення🤔`);
        
        bot.on('text', async (ctx) => {
          const quantity = parseInt(ctx.message.text);
          if (quantity > 0 && quantity <= currentProduct.stock) {
            await ctx.reply('Зв\'яжіться з менеджером для завершення замовлення або поверніться до вибору товару:', 
              Markup.inlineKeyboard([
                Markup.button.url('Зв\'язатися з менеджером👤', 'https://t.me/majorchamp1'),
                Markup.button.callback('Повернутись до вибору товару⬅️', 'return_to_shop')
              ], { columns: 1 }).resize()
            );
          } else {
            await ctx.reply('Некоректна кількість або недостатньо товару на складі😒');
          }
        });
      } else {
        await ctx.reply(`${currentProduct.name} наразі відсутній на складі❌`);
      }
    });
  });
})();

bot.action('return_to_shop', async (ctx) => {
  await ctx.answerCbQuery();
  await ctx.reply('Повертаємо вас до вибору товарів...');
  const products = await readProducts();
  const productButtons = products.map(product => 
    Markup.button.callback(`${product.name} (${product.stock} в наявності)`, `buy_${product.name}`)
  );
  
  await ctx.reply('Доступні товари:', Markup.inlineKeyboard(productButtons, { columns: 1 }).resize());
});

bot.on('callback_query', async (ctx) => {
  const queryData = ctx.callbackQuery.data;
  if (queryData.startsWith('https://t.me/majorchamp1?start=')) {
    const [productName, quantity] = queryData.split('=')[1].split('_');
    const products = await readProducts();
    const currentProduct = products.find(p => p.name === productName);
    if (currentProduct && quantity > 0 && quantity <= currentProduct.stock) {
      currentProduct.stock -= quantity;
      await writeProducts(products);
      await ctx.reply(`Ви замовили ${quantity} ${currentProduct.name}. Залишилось на складі: ${currentProduct.stock}`);
    } else {
      await ctx.reply('Некоректна кількість або недостатньо товару на складі😒');
    }
  }
});

bot.launch();
console.log('Бот запущений');

// https://www.amevape.com/wp-content/uploads/2024/05/HM021-12.jpg
// https://www.amevape.com/wp-content/uploads/2024/01/%E7%94%B5%E5%AD%90%E7%83%9F21.4psd-500x500.jpg
// 7216155455:AAEiQ_Lvu1Sw7LUSweKUdPNgbBswAqTZnGw




