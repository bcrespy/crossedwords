import { AudioAnalysedDataForVisualization } from '../audioanalysis/audio-analysed-data';
import config from '../config/visualizer.config';

/**
 * Simple classe qui gère la grille et permet de 
 * la dessiner 
 */


export class BinaryGrid
{
  /**
   * Crée une grille, remplie de 0 de taille width*height
   * @param {number} width la largeur de la grille
   * @param {number} height la hauteur de la grille
   * @param {number} cellsize taille x et y de la cellule, en px 
   */
  constructor( width, height, cellsize )
  {
    this.width = width;
    this.height = height;
    this.cellsize = cellsize;

    this.color = "white";
    this.colorList = [ "white", "#ADFF2F", "#E0FFFF", "#00FA9A", "#FFFF00" ];

    this.words = null;
    this.wordsArray = null;

    this.grid = new Uint8Array(width*height).fill();
    this.wordsGrid = new Int16Array(width*height).fill();

    /**
     * @type {CanvasRenderingContext2D}
     */
    this.context = null;
  }

  init()
  {
    return new Promise( (resolve, reject) => {
      let canvas = document.getElementById("canvas");
      this.context = canvas.getContext("2d");
      this.context.canvas.width = this.width * this.cellsize;
      this.context.canvas.height = this.height * this.cellsize;

      this.context.font = this.cellsize+"px Courrier";

      this.loadFile( "./dist/words").then(resolve);
    });
  }

  setVal( x, y, val )
  {
    this.grid[y*this.width+x] = val;
  }

  getVal( x, y )
  {
    return this.grid[y*this.width+x];
  }

  setWordOnGrid( x, y )
  {
    this.wordsGrid[y*this.width+x] = Math.floor(Math.random() * (this.wordsArray.length-1));
  }

  /**
   * Déplace aléatoirement certaines cases
   */
  glitch( intensity )
  {
    for( let i = 0; i < intensity; i++ )
    {
      let rand = Math.floor( Math.random() * this.width * this.height ),
          randDest = Math.floor( Math.random() * this.width * this.height );
      
      let tempValues = {
        val: this.grid[rand],
        word: this.wordsGrid[rand]
      };

      this.grid[rand] = this.grid[randDest];
      this.wordsGrid[rand] = this.wordsGrid[randDest];

      this.grid[randDest] = tempValues.val;
      this.wordsGrid[randDest] = tempValues.word;
    }
  }

  /**
   * Décalle les colonnes
   */
  shift()
  {
    for( let x = this.width-1; x > 0; x-- )
    {
      for( let y = 0; y < this.height; y++ )
      {
        this.setVal(x,y, this.getVal(x-1,y));
        this.wordsGrid[y*this.width+x] = this.wordsGrid[y*this.width+x-1];
      }
    }
  }

  /**
   *  
   * @param {AudioAnalysedDataForVisualization} audioData 
   */
  draw( audioData )
  {
    /*if( audioData.peak.value == 1 )
    {
      this.color = this.colorList[Math.floor(Math.random() * (this.colorList.length-1))];
      document.body.style.backgroundColor = this.color;
    }*/

    this.context.fillStyle = "white";//this.color;
    this.context.fillRect(0,0,900,900);

    this.context.fillStyle = "black";

    let trebleStrength = config.treble * audioData.peak.value * 0.05 * audioData.energy;

    for( let x = 0; x < this.width; x++ )
    {
      for( let y = 0; y < this.height; y++ )
      {
        //this.context.fillStyle = this.getVal(x,y) ? "black" : "white";
        //this.context.fillRect( x*this.cellsize, y*this.cellsize, this.cellsize, this.cellsize );
        if( this.getVal(x,y) ) 
          this.context.fillText( this.wordsArray[this.wordsGrid[y*this.width+x]], x*this.cellsize + (Math.random()-0.5) * trebleStrength, y*this.cellsize + (Math.random()-0.5) * trebleStrength );
      }
    }
  }

  getRandomWord()
  {
    return this.wordsArray[Math.floor(Math.random() * (this.wordsArray.length-1))];
  }

  loadFile( filename )
  {
    return new Promise( (resolve, reject) => {
      
      let xhr = new XMLHttpRequest();
      xhr.open("GET", filename, true);

      xhr.onreadystatechange = () => {
        if( xhr.readyState == 4 && xhr.status == 200 )
        {
          this.words = xhr.responseText;
          this.wordsArray = this.words.split(' ');
          resolve();
        }
      }

      xhr.send();

    })

  }
};