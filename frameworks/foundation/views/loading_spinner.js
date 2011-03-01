// ========================================================================
// SCUI.LoadingSpinnerView
// ========================================================================

/**

  Implements a PNG based animated loading spinner.
  The animation is simulated, offering the benefit of using a PNG sprite for
  the actual image so that more than 256 colors and transparency may be used.

  @extends SC.View
  @author Mike Ball

*/

SCUI.LoadingSpinnerView = SC.View.extend({
  
  //SCUI includes the following themes by default: darkTrans, lightTrans, darkSolidAqua, darkSolidWhite, lightSolidBlack, lightSolidGreen.
  //You can add your own themes by creating a CSS class with the name of the theme and specifying a background-image with the sprite
  //containing all the animation frames.
  theme: 'lightTrans',
  
  //Number of frames in the PNG sprite
  totalFrames: 28,
  
  //+1 for every append call, -1 for every remove call
  callCount: 0,
  
  //determines if the view is playing
  isPlaying: false,
  
  render: function(context, firstTime){
    if(firstTime){
      var classNames = ['loadingSpinner', 'lightTrans'];
      context.begin('div').addClass(classNames).addStyle({width: 18, height: 18, position: 'absolute'}).end();
    }
  },
  
  
  animate: function(){
    var currentFrame = this._currentFrame || 0;
    
    var offsetY= 0-18*currentFrame;
    this.$('div.loadingSpinner').css('background-position','0px %@px'.fmt(offsetY));
    //schedule next frame if animation is still supposed to play
    if(this.get('isPlaying')){
      this.invokeLater(this.animate, 150);  
    }
    
    currentFrame+=1;
    if(currentFrame === this.get('totalFrames')) currentFrame = 0;
    this._currentFrame = currentFrame;
  },
  
  
  //starts the animation if callCount >= 0
  callCountDidChange: function(){
    //If spinner is in a page start the animation (if needed)
    var that = this, isPlaying = this.get('isPlaying');
    if (!isPlaying && this.get('callCount') > 0){
      this.invokeOnce(function(){
        that.set('isVisible',true);
        that.set('isPlaying', true);
        that.animate();
      });
    
    }
    else if(isPlaying && this.get('callCount') <= 0){
      this.invokeOnce(function(){
        that.set('isPlaying', false);
        that.set('isVisible', false);
      });
    }
  }.observes('callCount')
});

