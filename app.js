import puppeteer from 'puppeteer';
import os from 'os';
import fs from 'fs';
import path from 'path';

(async () => {

	const rdn = (min, max) => {
	  min = Math.ceil(min)
	  max = Math.floor(max)
	  return Math.floor(Math.random() * (max - min)) + min
	}

	const browser = await puppeteer.launch({
		headless: false
	});
	
	// const page = await browser.newPage();

	// await page.goto('https://www.google.com/recaptcha/api2/demo');

	// const recaptchaSelector = await page.waitForSelector('iframe[src*="api2/anchor"]');
	// const frame = await recaptchaSelector.contentFrame();
	// await frame.waitForSelector('#recaptcha-anchor');
	// const checkbox = await frame.$('#recaptcha-anchor');
	
	// console.log("[+] Clicking reCAPTCHA Checkbox");
	
	// await checkbox.click({delay: rdn(30, 150)});

	// const recaptchaBoxSelector = await page.waitForSelector('iframe[src*="api2/bframe"]');
	// const boxFrame = await recaptchaBoxSelector.contentFrame();
	// await boxFrame.waitForSelector('#recaptcha-audio-button');
	// const audioButton = await boxFrame.$('#recaptcha-audio-button');

	// console.log("[+] Clicking Audio Button");

	// await audioButton.click({delay: rdn(30, 150)});

	// const audioBoxSelector = await page.waitForSelector('iframe[src*="api2/bframe"]');
	// const audioBoxFrame = await audioBoxSelector.contentFrame();
	// await audioBoxFrame.waitForSelector('.rc-audiochallenge-tdownload-link');
	// const audioLink = await audioBoxFrame.$eval('.rc-audiochallenge-tdownload-link', el => el.href)

	// console.log("[+] Returning Audio Link");

	// let filename = `${Date.now()}.mp3`

 //  const downloadAudio = await page.evaluate(audioLink => {
 //  	return (async () => {
 //  		const a = document.createElement('a')
	// 	  a.href = audioLink
	// 	  a.download = filename
	// 	  document.body.appendChild(a)
	// 	  a.style.display = 'none'
	// 	  a.click()
	// 	  a.remove()
 //  	})()
 //  }, audioLink)

 const page2 = await browser.newPage();
 await page2.goto('https://virtualspeech.com/tools/audio-to-text-converter');

 const emailInputSelector = await page2.waitForSelector('#emailInput');
 await emailInputSelector.type('mabargans@mailsac.com');

 const inputFileSelector = await page2.waitForSelector('#fileInput');
 await inputFileSelector.uploadFile('1.mp3'); 

 const closePricingBanner = await page2.waitForSelector('.sticky-footer-banner-exit');
 await closePricingBanner.click({delay: rdn(30, 150)});
 
 const submitSelector = await page2.waitForSelector('#submitButton');
 await submitSelector.click({delay: rdn(30, 150)});

 await page2.waitForTimeout(3000)

 const convertBtn = await page2.waitForSelector('#convertButton');
 await convertBtn.click();

 await page2.waitForTimeout(30000)

 await page2.goto('https://mailsac.com/login');
 const emailMailsac = await page2.waitForSelector('[name="username"]');
 await emailMailsac.type('anjeaye1231@gmail.com')

 const passwordMailsac = await page2.waitForSelector('[name="password"]');
 await passwordMailsac.type('Dzikru!234')

 const submitMailsac = await page2.waitForSelector('[type="submit"]');
 await submitMailsac.click();

 await page2.waitForTimeout(3000)

 await page2.goto('https://mailsac.com/inbox/mabargans%40mailsac.com');

 await page2.waitForTimeout(1000) 

 await page2.reload();

 const firstEmail = await page2.waitForSelector('.col-xs-4');
 await firstEmail.click();

 await page2.waitForTimeout(5000)

 const rawLinkSelector = await page2.waitForSelector('.btn-group.pull-right')
 const rawLink = await rawLinkSelector.$eval('[href*="raw"]', el => el.href)
 
 await page2.goto(rawLink.replace('?download=1', ''));
 const answerText = await page2.evaluate(() => {
 	const elem = document.querySelector('pre')
 	const text = elem.innerHTML
 	return text.match(/(?<=txt"\n\n)(.*)(?=.\n-)/s)[0]
 })

 console.log(answerText)

})();