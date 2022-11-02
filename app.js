import puppeteer from 'puppeteer';
import os from 'os';
import fs from 'fs';
import path from 'path';
import { Leopard } from '@picovoice/leopard-node';

(async () => {

	const rdn = (min, max) => {
	  min = Math.ceil(min)
	  max = Math.floor(max)
	  return Math.floor(Math.random() * (max - min)) + min
	}

	const browser = await puppeteer.launch({
		headless: false
	});

	const page = await browser.newPage();

	await page.goto('https://www.google.com/recaptcha/api2/demo');

	const recaptchaSelector = await page.waitForSelector('iframe[src*="api2/anchor"]');
	const frame = await recaptchaSelector.contentFrame();
	await frame.waitForSelector('#recaptcha-anchor');
	const checkbox = await frame.$('#recaptcha-anchor');
	
	console.log("[+] Clicking reCAPTCHA Checkbox");
	
	await checkbox.click({delay: rdn(30, 150)});

	const recaptchaBoxSelector = await page.waitForSelector('iframe[src*="api2/bframe"]');
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

	let filename = `./audio/${Date.now()}.mp3`

  const audioBytes = await page.evaluate(audioLink => {
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

	const inputCaptchaBoxSelector = await page.waitForSelector('iframe[src*="api2/bframe"]');
	const inputCaptchaBoxFrame = await inputCaptchaBoxSelector.contentFrame();
	await inputCaptchaBoxFrame.waitForSelector('#audio-response');
	const inputAnswer = await inputCaptchaBoxFrame.$('#audio-response');
	await inputAnswer.type(answer)

	console.log(`[+] Verify The Captcha`);

	await inputCaptchaBoxFrame.waitForSelector('#recaptcha-verify-button');
	const verifyButton = await inputCaptchaBoxFrame.$('#recaptcha-verify-button');
	await verifyButton.click();

	console.log(`[+] Captcha is Verified`);

})();