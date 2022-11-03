import puppeteer from 'puppeteer';
import os from 'os';
import fs from 'fs';
import path from 'path';
import { Leopard } from '@picovoice/leopard-node';

let pageURL = process.argv[2];
let dataSiteKey = process.argv[3];

(async () => {

	const rdn = (min, max) => {
	  min = Math.ceil(min)
	  max = Math.floor(max)
	  return Math.floor(Math.random() * (max - min)) + min
	}

	const browser = await puppeteer.launch({
		headless: false,
		args: [ '--proxy-server=socks5://127.0.0.1:9050' ]
	});

	await browser.defaultBrowserContext().overridePermissions(pageURL, ['clipboard-read', 'clipboard-write']);

	const page = await browser.newPage();

	await page.goto(pageURL);

	const recaptchaSelector = await page.waitForSelector('iframe[src*="api2/anchor"]');
	
	await page.evaluate((dataSiteKey) => {
		const iframe = document.querySelector('iframe[src*="api2/anchor"]');
		const url = iframe.src;
		iframe.src = url.replace(/(?<=k=)(.*?)(?=&)/gm, dataSiteKey)
	}, dataSiteKey)

	const frame = await recaptchaSelector.contentFrame();
	await frame.waitForSelector('#recaptcha-anchor');
	const checkbox = await frame.$('#recaptcha-anchor');
	
	console.log("[+] Clicking reCAPTCHA Checkbox");
	
	await checkbox.click({delay: rdn(30, 150)});

	const recaptchaBoxSelector = await page.waitForSelector('iframe[src*="api2/bframe"]');

	await page.evaluate((dataSiteKey) => {
		const iframe = document.querySelector('iframe[src*="api2/bframe"]');
		const url = iframe.src;
		iframe.src = url.replace(/(?<=k=)(.*?)(?=&)/gm, dataSiteKey)
	}, dataSiteKey)

	const boxFrame = await recaptchaBoxSelector.contentFrame();
	await boxFrame.waitForSelector('#recaptcha-audio-button');
	const audioButton = await boxFrame.$('#recaptcha-audio-button');

	console.log("[+] Clicking Audio Button");

	await audioButton.click({delay: rdn(30, 150)});

	const audioBoxSelector = await page.waitForSelector('iframe[src*="api2/bframe"]');
	const audioBoxFrame = await audioBoxSelector.contentFrame();
	await audioBoxFrame.waitForSelector('.rc-audiochallenge-tdownload-link');
	const audioLink = await audioBoxFrame.$eval('.rc-audiochallenge-tdownload-link', el => el.href)

	console.log("[+] Returning Audio Link");

	console.log("\n" + audioLink + "\n");

	let filename = `./audio/${Date.now()}.mp3`

	const page2 = await browser.newPage();
	await page2.goto('https://www.google.com/recaptcha/api2/demo');

  const audioBytes = await page2.evaluate(audioLink => {
    return (async () => {
      const response = await window.fetch(audioLink)
      const buffer = await response.arrayBuffer()
      return Array.from(new Uint8Array(buffer))
    })()
  }, audioLink)

  console.log("[+] Saving Audio File");

  fs.appendFileSync(filename, Buffer.from(audioBytes));

  console.log("[+] Analyzing Audio Answer");

  const accessKey = "6//3Xg+yxZx/+S4matNNvQGt3R7imDAQRWt89Z9vhWArUjHHigBiow==" // Obtained from the Picovoice Console (https://console.picovoice.ai/)
	const handle = new Leopard(accessKey);

	const result = handle.processFile(filename);

	const answer = result.transcript;

	console.log(`[+] The Answer is "${answer}"`);

	console.log(`[+] Place Answer to Input`);

	await page2.close();

	const inputCaptchaBoxSelector = await page.waitForSelector('iframe[src*="api2/bframe"]');
	const inputCaptchaBoxFrame = await inputCaptchaBoxSelector.contentFrame();
	await inputCaptchaBoxFrame.waitForSelector('#audio-response');
	const inputAnswer = await inputCaptchaBoxFrame.$('#audio-response');
	await inputAnswer.type(answer)

	console.log(`[+] Verify The Captcha`);

	await inputCaptchaBoxFrame.waitForSelector('#recaptcha-verify-button');
	const verifyButton = await inputCaptchaBoxFrame.$('#recaptcha-verify-button');
	await verifyButton.click();

	await page.waitForTimeout(3000);

	console.log(`[+] Captcha is Verified`);

	await page.bringToFront();

	const gCaptchaResponse = await page.evaluate(() => {
		const elem = document.querySelector('#g-recaptcha-response');
		elem.style.display = 'block'
		elem.focus();
		elem.select();
		return elem.value
	})

	console.log("\n" + gCaptchaResponse + "\n")

})();