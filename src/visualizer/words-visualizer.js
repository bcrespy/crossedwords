import { BinaryGrid } from './grid';
import { AudioAnalysedDataForVisualization } from '../audioanalysis/audio-analysed-data';
import config from "../config/visualizer.config";


export class WordsVisualizer 
{
  constructor()
  {
    this.grid = new BinaryGrid(48, 48, 8);
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
    let h = 64;
    let d = audioData.bufferSize / h;

    if( this.frames%2 == 0 )
    {
      this.grid.shift();

      for( let i = 0; i < h; i++ )
      {
        let fVal = audioData.frequenciesData[Math.floor(i * d)];
        this.grid.setVal(0, (h-1)-i, fVal > config.threshold ? 1 : 0);
        this.grid.setWordOnGrid(0,i);
      }
    }

    this.frames++;

    this.grid.glitch( Math.floor(audioData.peak.value * config.glitchStrength) );

    this.grid.draw( audioData );
  }
};