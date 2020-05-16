import { Component  } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { ApiService } from './services/ApiService';
import { Router } from '@angular/router';
import { pathService } from './services/path.service';
@Component({
  selector: 'app-root',
  // Assign which html page to this component.
  templateUrl: './app.page-prestige.html',
  styleUrls: ['./app.page-prestige.css']
})
export class PagePrestigeComponent {
    // Variables we're gonna use in this page
    username              = '';
    
    token                 = '';
    message               = '';
    _apiService:ApiService;
    site: string;

    prestigeArray:any
    bitcoin: number
    prestigePoints: number

    purchaseablePrestige: number = 0
    nextPrestige: number = 0

    soundImg: string = "assets/images/SoundOn.png";
    musicImg: string = "assets/images/musicOn.png"
    musicPlayer = <HTMLAudioElement>document.getElementById("musicPlayer")
    currentSong: string = "assets/sounds/songs/theme.mp3";
    hoverSoundFile = 'assets/sounds/HoverSound.mp3'
    clickSoundFile = 'assets/sounds/ClickSound.mp3'

    // Volume Settings Stuff
    soundVolumeImg: string = 'assets/images/VolumeSettings0.6.png'
    musicVolumeImg: string = 'assets/images/VolumeSettings0.6.png'

    // This constructor is basically "do these things when the page is being loaded"
    constructor(private http: HttpClient, private router:Router, pathService: pathService) {
        this._apiService = new ApiService(http, this, pathService);
        this.site = pathService.path;
        this.musicPlayer.loop = true;
        this.musicPlayer.volume = 0.5;
        this.setup()
    }

    // Used when page is loaded up. Loads each function one at a time in order to fix potential
    // issues with functions relying on other functions finishing to work.
    async setup(){
        await this.getPrestigeItems()
        await this.getPrestigePoints()
        await this.getBitcoin()
        await this.setSound()
        await this.setMusic()
        await this.setSoundVolume()
        await this.setMusicVolume()
        console.log("-----------------------------------PRESTIGE PAGE SETUP -----------------------------------------")
    }

    // Get user's bitcoin from the database
    getBitcoin() {
        // Set variable 'inshop' in session storage to 'true'. This is used to tell the autosave that the user is in the shop and should not be auto saving.
        sessionStorage.setItem('inshop', 'true')
        // Locate which appropriate controller function to use. In this case, we use getBitcoin function in UserController.js
        // You can find this out in router.js
        let url = this.site + 'user/getBitcoin'
        // Send a POST request with email data.
        // In UserController.js, this email data is recieved by "req.body.email"
        // This is how we get data from frontend(Andular, files in "src/app" folder) to backend(Node.JS, controllers folder and data folder).
        this.http.post<any>(url, {
            email: sessionStorage.getItem("email")
        })
            .subscribe(
                // You can see and change what data is being received by looking at "res.json()" in the appropriate controller function.
                // If data is recieved,
                (data) => {
                    this.bitcoin = data
                    console.log('bitcoin: ', data)
                    this.calculatePrestigePoints()
                } )
    }

    // Get user's prestige points from the database
    getPrestigePoints() {
        // Set variable 'inshop' in session storage to 'true'. This is used to tell the autosave that the user is in the shop and should not be auto saving.
        sessionStorage.setItem('inshop', 'true')
        // Locate which appropriate controller function to use. In this case, we use getPrestigePoints function in UserController.js
        // You can find this out in router.js
        let url = this.site + 'user/getPrestigePoints'
        // Send a POST request with email data.
        // In UserController.js, this email data is recieved by "req.body.email"
        // This is how we get data from frontend(Angular, files in "src/app" folder) to backend(Node.JS, controllers folder and data folder).
        this.http.post<any>(url, {
            email: sessionStorage.getItem("email")
        })
            .subscribe(
                // You can see and change what data is being received by looking at "res.json()" in the appropriate controller function.
                // If data is recieved,
                (data) => {
                    console.log('prestige points: ', data)
                    this.prestigePoints = data
                } )
    }

    // Get all the prestige items in the database
    getPrestigeItems() {
        // Locate which approrpiate controller function to use. In this case, we use getPrestigeItems function in GameController.js
        // You can find this out in router.js
        let url = this.site + 'Game/getPrestigeItems'
        this.http.get<any>(url)
            .subscribe(
                // You can see and change what data is being received by looking at "res.json()" in the appropriate controller function.
                // If data is recieved,
                (data) => {
                    // console log the data (For debugging purposes).
                    console.log('all prestige items: ', data)
                    this.prestigeArray = data
                } )
    }

    // Calculates how many prestige points you can buy with your current bitcoin
    // * This is all visual. The actual calculations are in the user repo.
    calculatePrestigePoints() {
        // Set the variable for the initial cost for a prestige point
        let prestigeCost = 10000
        // Set the variable for how many prestige points you can buy
        this.purchaseablePrestige = 0
        // If you have more bitcoins than the prestige cost
        if (prestigeCost <= this.bitcoin){
            // Start a while loop while you have more bitcoins than the prestige cost
            while (prestigeCost <= this.bitcoin) {
                // Be able to buy an additional prestige point
                this.purchaseablePrestige += 1
                // Formula for calculating the next cost of a prestige point
                prestigeCost = Math.pow(prestigeCost, 1.1)
                // Have a flat cost for clarity
                prestigeCost = Math.floor(prestigeCost)
            }
        }
        // If the user cannot afford any prestige points
        else {
            // Say in the console that they cannot buy any
            console.log("Can't afford any prestige points :(")
        }
        // Set the cost for the next prestige point (for html)
        this.nextPrestige = prestigeCost
        console.log('cost of next prestige: ', prestigeCost)
        console.log('purchasable prestige: ', this.purchaseablePrestige)
    }

    buyPrestigePoint(){
        if(this.bitcoin < 10000){
            this.message = "You don't have enough bitcoin!"
        } else {
            this.bitcoin = 0
            this.purchaseablePrestige = 0
            this.nextPrestige = 0
            let url = this.site + "user/resetGainPrestige"
            this.http.post<any>(url, {
                email: sessionStorage.getItem("email")
            })
            .subscribe(
                (data) => {
                    console.log(data)
                    this.getPrestigePoints()
                }
            )
        }
    }

    // Buy. This function is called whenver user buys something. In the parameters, name is the item name and price is the item price.
    buy(name, price) {
        // If user doesnt have enough bitcoins,
        if(this.prestigePoints < price){
            // let em know.
            this.message = "You don't have enough prestige points!"
        }
        // If user DOES have enough bitcoin,
        else {
            // Deduct bitcoin from item price (Visually only).
            this.prestigePoints -= price
            // Thank the user
            this.message = "Thank you come again!"
            // Call make_transaction function with the item name
            this.make_transaction(name)
        }
    }

    // This function is to increase the user's quantity of the item
    make_transaction(name){
        // Locate whic appropriate controller function to use. In this case, we use makeTransaction function in UserController.js
        // You can tell how by looking in router.js
        let url = this.site + 'user/makePrestigeTransaction'
        // Send a POST request with email and item name data.
        // In UserController.js, this data is recieved by "req.body.[whatever we want to grab]"
        // This is how we get data from frontend(Andular, files in "src/app" folder) to backend(Node.JS, controllers folder and data folder).
        this.http.post<any>(url, {
            email: sessionStorage.getItem("email"),
            name: name
        })
            .subscribe(
                // You can see and change what data is being received by looking at "res.json()" in the appropriate controller function.
                // If data is recieved,
                (data) => {
                    // console log the data (for debugging purposes)
                    console.log(data)
                    this.saveProgress()
                }
            )
    }

    // Save progress
    saveProgress() {
        // Locate which appropriate controller function to use. In this case, we use saveProgress function in UserController.js
        // You can tell how by looking in router.js
        let url = this.site + 'user/savePrestigeProgress'
        // Send a POST request with email and bitcoin data.
        // In UserController.js, this data is recieved by "req.body.[whatever we want to grab]"
        // This is how we get data from frontend(Andular, files in "src/app" folder) to backend(Node.JS, controllers folder and data folder).
        this.http.post<any>(url, {
            email: sessionStorage.getItem("email"),
            prestigePoints: this.prestigePoints
        })
            .subscribe(
                // You can see and change what data is being received by looking at "res.json()" in the appropriate controller function.
                // If data is recieved,
                (data) => {
                    // console log the data (for debugging purposes)
                    console.log(data)
                } )
    }

    // This function is called when the using comes to the main page. Changes image and sound
    // settings based on what they were the last time you entered the main page.
    async setSound() {
        // If sound is turned on
        if (sessionStorage.getItem('sound') == 'true'){
            // Keep sound on and change the image accordingly
            sessionStorage.setItem('sound', 'true')
            this.soundImg = "assets/images/SoundOn.png";
        }
        // If sound is turned off
        else if (sessionStorage.getItem('sound') == 'false'){
            // Keep sound off and change the image accordingly
            sessionStorage.setItem('sound', 'false')
            this.soundImg = "assets/images/SoundOff.png";
        }
        // If sound has not been set this session
        else {
            // Turn sound on
            sessionStorage.setItem('sound', 'true')
            this.soundImg = "assets/images/SoundOn.png";
        }
    }

    // This function is called every time the user clicks on the sound icon to turn on/off the sound
    changeSound() {
        // If the session variable "sound" is set to "true"
        if (sessionStorage.getItem('sound') == 'true') {
            //Set the session variable "sound" to false and change the image accordingly
            sessionStorage.setItem('sound', 'false');
            this.soundImg = "assets/images/SoundOff.png";
        }

        // If the session variable "sound" is set to "false"
        else if (sessionStorage.getItem('sound') == 'false') {
            //Set the session variable "sound" to true and change the image accordingly
            sessionStorage.setItem('sound', 'true');
            this.soundImg = "assets/images/SoundOn.png";
        }
    }

    // This function is called when the using comes to the main page. Changes image and music
    // settings based on what they were the last time you entered the main page.
    async setMusic() {
        // If music is turned on
        if (sessionStorage.getItem('music') == 'true'){
            // Keep music on
            sessionStorage.setItem('music', 'true')
            // Change image accordingly
            this.musicImg = "assets/images/musicOn.png"
            // If music has already been playing, tell this in the console
            if (this.musicPlayer.duration > 0 && !this.musicPlayer.paused) {
                console.log("Music already playing")
            }
            // If music is not playing
            else {
                // Start music
                this.musicPlayer.src = this.currentSong;
                this.musicPlayer.load();
                this.musicPlayer.play();
                
            }
        }

        // If music is turned off
        else if (sessionStorage.getItem('music') == 'false'){
            // Keep music off
            sessionStorage.setItem('music', 'false');
            // Pause music and change image accordingly
            this.musicPlayer.pause()
            this.musicImg = "assets/images/musicOff.png"
        }

        // If music has not been set yet
        else {
            // Turn music on, start playing music and change image accordingly
            sessionStorage.setItem('music', 'true')
            this.musicPlayer.src = this.currentSong;
            this.musicPlayer.load();
            this.musicPlayer.play();
            this.musicImg = "assets/images/musicOn.png"
        }
    }

    // This function is called every time the user clicks on the music icon to turn on/off the music
    changeMusic() {
        // If music is turned on
        if (sessionStorage.getItem('music') == 'true'){
            // Turn off music, pause music, and change image accordingly
            sessionStorage.setItem('music', 'false');
            this.musicPlayer.pause()
            this.musicImg = "assets/images/musicOff.png"
            console.log("music off")
        }

        // If music is turned off
        else if (sessionStorage.getItem('music') == 'false'){
            // Turn on music, play music, and change image accordingly
            sessionStorage.setItem('music', 'true')
            this.musicPlayer.play();
            this.musicImg = "assets/images/musicOn.png"
        }
    }

    // This function plays a sound when the user hovers over a button.
    hoverSound() {
        // If sound is turned on
        if (sessionStorage.getItem('sound') == 'true') {
            // Create an audio instance to play the file
            let audio = new Audio()
            // Set the sound file to play
            audio.src = this.hoverSoundFile
            // Set the volume of the sound
            audio.volume = parseFloat(sessionStorage.getItem('soundVolume'))
            // Load the audio instance with the sound file
            audio.load();
            // Play it.
            audio.play();
        }
    }

    // This function plays a sound when the user clicks on a button.
    clickSound() {
        // If sound is turned on
        if (sessionStorage.getItem('sound') == 'true') {
            // Create an audio instance to play the file
            let audio = new Audio()
            // Set the sound file to play
            audio.src = this.clickSoundFile
            // Set the volume of the sound
            audio.volume = parseFloat(sessionStorage.getItem('soundVolume'))
            // Load the audio instance with the sound file
            audio.load();
            // Play it.
            audio.play();
        }
    }

    // Function to set the sound volume when entering the page
    async setSoundVolume(){
        // If the sound volume has been set
        if (sessionStorage.getItem('soundVolume') != null){
            // Get the current sound volume
            let volume = sessionStorage.getItem('soundVolume')
            // Change the sound volume image in the settings based on the current sound volume
            this.soundVolumeImg = "assets/images/VolumeSettings" + volume + ".png";
        }
        // If the sound volume has not been set
        else {
            // Set the sound volume to the value 0.6 (around mid-range volume)
            sessionStorage.setItem('soundVolume', '0.6')
            // Get the newly set sound volume
            let volume = sessionStorage.getItem('soundVolume')
            // Change the sound volume image in the settings based on the new sound volume
            this.soundVolumeImg = "assets/images/VolumeSettings" + volume + ".png";
        }
    }
    
    // Function to set the music volume when entering the page
    async setMusicVolume() {
        // If the music volume has been set
        if (sessionStorage.getItem('musicVolume') != null){
            // Get the current music volume
            let volume = sessionStorage.getItem('musicVolume')
            // Change the music volume image in the settings based on the current music volume
            this.musicVolumeImg = "assets/images/VolumeSettings" + volume + ".png";
            // Change the volume of the music to the current music volume
            this.musicPlayer.volume = parseFloat(sessionStorage.getItem('musicVolume'))
        }
        // If the music volume has not been set
        else {
            // Set the music volume to the value 0.6 (around mid-range volume)
            sessionStorage.setItem('musicVolume', '0.6')
            // Get the newly set music volume
            let volume = sessionStorage.getItem('musicVolume')
            // Change the music volume image in the settings based on the new music volume
            this.musicVolumeImg = "assets/images/VolumeSettings" + volume + ".png";
            // Change the volume of the music to the current music volume
            this.musicPlayer.volume = parseFloat(sessionStorage.getItem('musicVolume'))
        }
    }


}