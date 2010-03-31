// ==========================================================================
// SCUI.Statechart
// ==========================================================================
require('system/state');
/**
  @namespace
  
  A most excellent statechart implementation
  
  @author: Mike Ball
  @author: Michael Cohen
  @author: Evin Grano
  @version: 0.1
  @since: 0.1
*/

SCUI.Statechart = {
  
  isStatechart: true,
  
  initMixin: function(){
    //setup data
    this._all_states = {};
    this._all_states[SCUI.DEFAULT_TREE] = {};
    this._current_state = {};
    this._current_state[SCUI.DEFAULT_TREE] = null;
    //alias sendAction
    this.sendAction = this.sendEvent;
    //add all unregistered states
    var key, tree, state;
    for(key in this){
      if(this.hasOwnProperty(key) && SC.kindOf(this[key], SCUI.State) && this[key].get && !this[key].get('beenAddedToStatechart')){
        state = this[key];
        this._addState(key, state);
      }
    }
    
    //init the statechart
  },
  /**
    Adds a state to a state manager
    
    if the stateManager and stateName objects are blank it is assumed
    that this state will be picked up by the StateManger's init
    
    @param {Object} the state definition
    @param {SC.Object} Optional: Any SC.Object that mixes in SCUI.Statechart 
    @param {String} Optional: the state name
    @returns {SCUI.State} the state object
  */
  registerState: function(stateDefinition, stateManager, stateName){
    
    var state, tree;
    //create the state object
    state = SCUI.State.create(stateDefinition);
    
    //passed in optional arguments
    if(stateManager && stateName){
      if(stateManager.isStatechart){

        stateManager._addState(stateName, state);
        //TODO: init the state!
      }
      else{
        throw 'Cannot add state: %@ because state manager does not mixin SCUI.Statechart'.fmt(state.get('name'));
      }
    }
    else{
      state.set('beenAddedToStatechart', NO);
    }
    //push state onto list of states
    
    return state;
  },
  
  goState: function(requestdState, tree){
    var currentState = this._current_state[tree],
        enterStates = [],
        exitStates = [],
        enterMatchIndex,
        exitMatchIndex,
        pivotState,
        i;
    if(!tree) throw 'State requesting go does not have a valid parallel Tree';
    
    requestdState = this._all_states[tree][requestdState];
    if(!requestdState) throw 'Could not find the requested state!';

    enterStates = this._parentStates(requestdState, this._all_states[tree]);
    exitStates = currentState ? this._parentStates(currentState, this._all_states[tree]) : [];
    
    //find common ancestor
    // YES this is O(N^2) but will do for now....
    pivotState = exitStates.forEach(function(item,index){
      exitMatchIndex = index;
      enterMatchIndex = enterStates.indexOf(item);
      if(enterMatchIndex >= 0) return YES;
    });
    
    //call enterState and exitState on all states
    for(i = 0; i < exitMatchIndex; i += 1){
      //TODO store history state
      exitStates[i].exitState();
    }
    
    for(i = 0; i < enterMatchIndex; i += 1){
      //TODO call initState?
      enterStates[i].enterState();
    }
    
    this._current_state[tree] = requestdState;
  },
  
  currentState: function(tree){
    tree = tree || SCUI.DEFAULT_TREE;
    return this._current_state[tree];
  },
  
  /**
    Sends the event to all the parallel state's current state
    and walks up the graph looking if current does not respond
    
    @param {String} action name of action
    @param {Object} sender object sending the action
    @param {Object} context optional additonal context info
    @returns {SC.Responder} the responder that handled it or null
  */
  sendEvent: function(action, sender, context) {
    var trace = this.get('trace'),
        handled = NO,
        currentStates = this._current_state,
        responder;
    
    this._locked = YES;
    if (trace) {
      console.log("%@: begin action '%@' (%@, %@)".fmt(this, action, sender, context));
    }
    
    for(var tree in currentStates){
      if(currentStates.hasOwnProperty(tree)){
        handled = NO;
        
        responder = currentStates[tree];
       
        while(!handled && responder){
          if(responder.tryToPerform){
            handled = responder.tryToPerform(action, sender, context);
          }
          
          if(!handled) responder = responder.get('parentState') ? this._all_states[tree][responder.get('parentState')] : null;
        }
        
        if (trace) {
          if (!handled) console.log("%@:  action '%@' NOT HANDLED in tree %@".fmt(this,action, tree));
          else console.log("%@: action '%@' handled by %@ in tree %@".fmt(this, action, responder.get('name'), tree));
        }
      }
    }
    
    this._locked = NO ;
    
    return responder ;
  },
  
  
  
  _addState: function(name, state){
    state.set('stateManager', this);
    state.set('name', name);
    var tree = state.get('parallelStatechart') || SCUI.DEFAULT_TREE;
    state.setIfChanged('parallelStatechart', tree);
    
    if(!this._all_states[tree]) this._all_states[tree] = {};
    if(this._all_states[tree][name]) throw 'Trying to add state %@ to state tree %@ and it already exists'.fmt(name, tree);
    this._all_states[tree][name] = state;
    
    state.set('beenAddedToStatechart', YES);
  },
  
  
  _parentStates: function(state, tree){
    var ret = [], curr = state;
    
    //always add the first state
    ret.push(curr);
    curr = curr.get('parentState');
    
    while(curr.get && tree[curr.get('parentState')]){
      ret.push(tree[curr]);
      curr = tree[curr.get('parentState')];
    }
    //always push the root
    ret.push('root');
    return ret;
  }
  
 
};