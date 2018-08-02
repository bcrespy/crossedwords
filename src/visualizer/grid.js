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
   * 
   * @param {number} gridsize la taille de la grosse grille
   * @param {number} spawngridsize la taille de la petite grille
   */
  constructor( gridsize, spawngridsize, cellsize )
  {
    this.gridsize = gridsize;
    this.spawngridsize = spawngridsize;
    this.cellsize = cellsize;

    this.words = null;
    this.wordsArray = null;

    this.grid = new Uint8Array(gridsize*gridsize).fill();
    this.wordsGrid = new Int16Array(gridsize*gridsize).fill();

    /**
     * @type {CanvasRenderingContext2D}
     */
    this.context = null;

    this.ruleset = [1, 1, 0, 0, 0, 1, 1, 0];

    this.rules = [
      [ 1, 1, 0, 0, 0, 1, 1, 0 ],
      [ 0, 1, 0, 1, 1, 0, 1, 0 ],
      [ 1, 1, 0, 0, 1, 0, 1, 0 ],
      [ 1, 0, 0, 0, 1, 1, 1, 1 ],
      [ 1, 1, 0, 0, 0, 1, 1, 0 ],
      [ 0, 1, 1, 0, 1, 0, 1, 0 ],
      [ 1, 1, 1, 1, 0, 0, 0, 1 ],
      [ 1, 0, 0, 0, 1, 1, 1, 0 ],
      [ 1, 1, 1, 1, 0, 1, 1, 0 ],
      [ 1, 1, 1, 1, 0, 1, 0, 0 ],
      [ 0, 1, 1, 1, 1, 1, 0, 0 ]
    ];
    
    //this.ruleset = [ 0, 1, 0, 1, 1, 0, 1, 0 ];
    //this.ruleset = [ 1, 1, 0, 0, 1, 0, 1, 0 ];
    //this.ruleset = [ 1, 0, 0, 0, 1, 1, 1, 1 ];
    //this.ruleset = [ 1, 1, 0, 0, 0, 1, 1, 0 ];
    //this.ruleset = [0, 1, 1, 0, 1, 0, 1, 0];
    //[1, 1, 1, 1, 0, 0, 0, 1]
    // [1, 0, 0, 0, 1, 1, 1, 0]
    // [1, 1, 1, 1, 0, 1, 1, 0]
    // [1, 1, 1, 1, 0, 1, 0, 0]
    // [0, 1, 1, 1, 1, 1, 0, 0]

    config.generateRuleset = () => { this.generateRuleset(); };
  }

  generateRuleset()
  {
    for( let i = 0; i < 8; i++ )
    {
      this.ruleset[i] = Math.round(Math.random());
    }

    console.log( "ruleset :" );
    console.log( this.ruleset );
  }

  init()
  {
    return new Promise( (resolve, reject) => {
      let canvas = document.getElementById("canvas");
      this.context = canvas.getContext("2d");
      this.context.canvas.width = this.gridsize * this.cellsize;
      this.context.canvas.height = this.gridsize * this.cellsize;

      this.context.font = this.cellsize+"px Courrier";

      this.loadFile( "./dist/words").then(resolve);
    });
  }

  setVal( x, y, val )
  {
    this.grid[y*this.gridsize+x] = val;
  }

  getVal( x, y )
  {
    return this.grid[y*this.gridsize+x];
  }

  setWordOnGrid( x, y )
  {
    let randomIdx = Math.floor(Math.random() * (this.wordsArray.length-1));
    this.wordsGrid[y*this.gridsize+x] = randomIdx;
  }


  /**
   * Déplace aléatoirement certaines cases
   * @param {number} intensity intensité du glicth, en norme de mots (approx.)
   */
  glitch( intensity )
  {
    for( let i = 0; i < intensity; i++ )
    {
      let rand = Math.floor( Math.random() * this.gridsize * this.gridsize ),
          randDest = Math.floor( Math.random() * this.gridsize * this.gridsize );
      
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
   * Décalle les informations dans les tableaux de 1 vers la droite
   */
  shift()
  {
    for( let x = this.gridsize-1; x > 0; x-- )
    {
      // on triche un peu 
      this.setWordOnGrid(0,x);

      for( let y = 0; y < this.gridsize; y++ )
      {
        if( x < config.automateStart )
        {
          this.setVal(x,y, this.getVal(x-1,y));
        }
        else 
        {
          // on récupère les valeurs d'intérêt de l'automate
          let topIdx = (x-1) + (y-1) * this.gridsize,
              topVal = y == 0 ? 0 : this.grid[topIdx],
              midVal = this.grid[topIdx+this.gridsize],
              bottomVal = y == this.gridsize-1 ? 0 : this.grid[topIdx+this.gridsize*2];

          let val = this.automate( topVal, midVal, bottomVal );
          this.setVal(x, y, val);
        }
        
        this.wordsGrid[y*this.gridsize+x] = this.wordsGrid[y*this.gridsize+x-1];
      }
    }
  }


  /**
   * Retourne, pour un set de 3 valeurs, une valeur de retour 
   */
  automate( a, b, c )
  {
    if( a && b && c ) return this.ruleset[0];
    else if( a && b && !c ) return this.ruleset[1];
    else if( a && !b && c ) return this.ruleset[2];
    else if( a && !b && !c ) return this.ruleset[3];
    else if( !a && b && c ) return this.ruleset[4];
    else if( !a && b && !c ) return this.ruleset[5];
    else if( !a && !b && c ) return this.ruleset[6];
    else if( !a && !b && !c ) return this.ruleset[7];

    return 0;
  }


  /**
   * 
   * @param {AudioAnalysedDataForVisualization} audioData 
   */
  draw( audioData )
  {
    this.context.fillStyle = "#3b1af3";
    this.context.fillRect(0,0,this.gridsize*this.cellsize,this.gridsize*this.cellsize);

    this.context.fillStyle = "#2bffdb";

    let trebleStrength = config.treble * audioData.peak.value * 0.05 * audioData.energy;

    for( let x = 0; x < this.gridsize; x++ )
    {
      for( let y = 0; y < this.gridsize; y++ )
      {
        if( this.getVal(x,y) ) {
          this.context.fillText( this.wordsArray[this.wordsGrid[y*this.gridsize+x]], x*this.cellsize + (Math.random()-0.5) * trebleStrength, y*this.cellsize + (Math.random()-0.5) * trebleStrength );
          //this.context.fillRect( x*this.cellsize, y*this.cellsize, this.cellsize, this.cellsize );
        }
      }
    }
  }


  /**
   * Sélection un ruleset parmi la liste des ruleset
   */
  setRulesetFromList()
  {
    this.ruleset = this.rules[Math.floor(Math.random()*this.rules.length)];
  }


  /**
   * Retourne un mot aléatoire dans le tableau des mots crée depuis 
   * le fichier chargé 
   */
  /*getRandomWord()
  {
    return this.wordsArray[Math.floor(Math.random() * (this.wordsArray.length-1))];
  }*/


  /**
   * Charge un fichier puis retourne son contenu sous la forme d'une chaine 
   * de caractères
   * @param {string} filename chemin du fichier à charger 
   */
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
          this.wordsArray[0] = "CHAOS";
          resolve();
        }
      }

      xhr.send();

    })

  }
};