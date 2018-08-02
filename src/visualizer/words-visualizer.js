import { BinaryGrid } from './grid';
import { AudioAnalysedDataForVisualization } from '../audioanalysis/audio-analysed-data';
import config from "../config/visualizer.config";


export class WordsVisualizer 
{
  constructor()
  {
    this.smallgridsize = 41;
    this.gridsize = 71;
    this.cellsize = 6;

    this.grid = new BinaryGrid( this.gridsize, this.smallgridsize, this.cellsize );
    this.frames = 0;
  }

  init()
  {
    return new Promise( (resolve, reject) => {
      this.grid.init().then(resolve);
    });
  }

  /**
   *  
   * @param {AudioAnalysedDataForVisualization} audioData 
   */
  draw( audioData )
  {
    let h = this.smallgridsize;
    let d = audioData.bufferSize / h;
    let yOffset = (this.gridsize-this.smallgridsize)/2;

    if( this.frames%2 == 0 )
    {
      this.grid.shift();

      for( let i = 0; i < h; i++ )
      {
        let fVal = audioData.frequenciesData[Math.floor(i * d)];
        this.grid.setVal(0, (this.gridsize-1)-(i+yOffset), fVal > config.threshold ? 1 : 0);
      }
    }
    else 
    {
      for( let i = 0; i < this.gridsize; i++ )
      {
        if( i == yOffset )
          i = yOffset + h;
        
        this.grid.setVal( 0, i, 0 );
      }
    }

    if( this.frames%config.framesBeforeChange == 0 )
      this.grid.setRulesetFromList();

    this.frames++;

    this.grid.glitch( Math.floor(audioData.peak.value * config.glitchStrength) );

    this.grid.draw( audioData );
  }
};