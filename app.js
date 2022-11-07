import puppeteer from 'puppeteer';
import fs from 'fs';
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
		headless: true,
		args: [ '--window-size=500,500', '--window-position=000,000', '--disable-web-security' ]
	});

	const page = await browser.newPage();

	await page.goto(pageURL);
	
	await page.evaluate( async (dataSiteKey) => {
		const iframeAnchor = document.querySelector('iframe[src*="api2/anchor"]');
		const urlAnchor = iframeAnchor.src;
		iframeAnchor.src = urlAnchor.replace(/(?<=k=)(.*?)(?=&)/gm, dataSiteKey)

		const iframeBframe = document.querySelector('iframe[src*="api2/bframe"]');
		if(iframeBframe)
		{
			const urlBframe = iframeBframe.src;
			iframeBframe.src = urlBframe.replace(/(?<=k=)(.*?)(?=&)/gm, dataSiteKey)
		}
		await new Promise(resolve => setTimeout(resolve, 6000));
	}, dataSiteKey)

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

	await page.waitForTimeout(5000)

	await page.screenshot({path: './cache/audio.jpg'})

	await boxFrame.waitForSelector('.rc-audiochallenge-tdownload-link');
	const audioLink = await boxFrame.$eval('.rc-audiochallenge-tdownload-link', el => el.href)

	console.log("[+] Returning Audio Link");

	console.log("\n" + audioLink + "\n");

	let filename = `./cache/audio/${Date.now()}.mp3`

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

	const gCaptchaResponse = await page.evaluate(() => {
		const elem = document.querySelector('#g-recaptcha-response');
		elem.style.display = 'block'
		elem.focus();
		elem.select();
		return elem.value
	})

	console.log("\n" + gCaptchaResponse + "\n")

})();