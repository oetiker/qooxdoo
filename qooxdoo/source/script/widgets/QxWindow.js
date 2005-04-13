function QxWindow(vCaption, vIcon)
{
  QxPopup.call(this);

  this.setBorder(QxBorder.presets.outset);
  this.setMinWidth(200);
  this.setMinHeight(100);

  this.addEventListener("mousedown", this._onwindowmousedown, this);
  this.addEventListener("mouseup", this._onwindowmouseup, this);
  this.addEventListener("mousemove", this._onwindowmousemove, this);


  // ***********************************************************************
  //   RESIZEFRAME
  // ***********************************************************************
  this._resizeFrame = new QxWidget();
  
  this._resizeFrame.setBorder(QxBorder.presets.black);
  this._resizeFrame.setTimerCreate(false);
  this._resizeFrame.setOpacity(0.3);



  // ***********************************************************************
  //   CAPTIONBAR
  // ***********************************************************************
  this._captionbar = new QxWidget;
  this._captionbar.set({ cssClassName : "QxWindowCaptionBar", top : 0, left: 0, right : 0, height: 18 });

  this._captionbar.addEventListener("mousedown", this._oncaptionmousedown, this);
  this._captionbar.addEventListener("mouseup", this._oncaptionmouseup, this);
  this._captionbar.addEventListener("mousemove", this._oncaptionmousemove, this);

  this.add(this._captionbar);



  // ***********************************************************************
  //   PANE
  // ***********************************************************************
  this._pane = new QxWidget;
  this._pane.set({ cssClassName : "QxWindowPane", top : 18, bottom: 18, left: 0, right: 0 });
  this.add(this._pane);



  // ***********************************************************************
  //   STATUSBAR
  // ***********************************************************************
  this._statusbar = new QxWidget;
  this._statusbar.set({ cssClassName : "QxWindowStatusBar", bottom: 0, left: 0, right: 0, height: 18 });
  this._statusbar.setBorder(QxBorder.presets.thinInset);
  this.add(this._statusbar);



  // ***********************************************************************
  //   ARGUMENTS
  // ***********************************************************************
  if (isValidString(vIcon)) {
    this.setIcon(vIcon);
  };

  if (isValidString(vCaption)) {
    this.setCaption(vCaption);
  };
};

QxWindow.extend(QxPopup, "QxWindow");

/*
  Supported states (by state property):
  null (normal), minmized, maximized
*/

QxWindow.addProperty({ name : "active", type : Boolean, defaultValue : false });
QxWindow.addProperty({ name : "modal", type : Boolean, defaultValue : false });
QxWindow.addProperty({ name : "opener", type : Object });

QxWindow.addProperty({ name : "caption", type : String });
QxWindow.addProperty({ name : "icon", type : String });

QxWindow.addProperty({ name : "showClose", type : Boolean, defaultValue : true, impl : "showButton" });
QxWindow.addProperty({ name : "showMaximize", type : Boolean, defaultValue : true, impl : "showButton" });
QxWindow.addProperty({ name : "showMinimize", type : Boolean, defaultValue : true, impl : "showButton" });

QxWindow.addProperty({ name : "allowClose", type : Boolean, defaultValue : true });
QxWindow.addProperty({ name : "allowMaximize", type : Boolean, defaultValue : true });
QxWindow.addProperty({ name : "allowMinimize", type : Boolean, defaultValue : true });

QxWindow.addProperty({ name : "showCaption", type : Boolean, defaultValue : true });
QxWindow.addProperty({ name : "showIcon", type : Boolean, defaultValue : true });

QxWindow.addProperty({ name : "resizeable", type : Boolean, defaultValue : true });
QxWindow.addProperty({ name : "moveable", type : Boolean, defaultValue : true });




/*
------------------------------------------------------------------------------------
  MANAGER
------------------------------------------------------------------------------------
*/

proto._windowManager = new QxWindowManager();





/*
------------------------------------------------------------------------------------
  OVERWRITE POPUP METHODS
------------------------------------------------------------------------------------
*/

proto._beforeShow = function(uniqModIds)
{
  QxAtom.prototype._beforeShow.call(this, uniqModIds);

  (new QxPopupManager).update();

  this._windowManager.add(this);
  this._makeActive();

  this._layoutCommands();
};

proto._beforeHide = function(uniqModIds)
{
  QxAtom.prototype._beforeHide.call(this, uniqModIds);

  this._windowManager.remove(this);
  this._makeInactive();
};

proto.bringToFront = proto.sendToBack = function() {
  throw new Error("Warning: bringToFront() and sendToBack() are not supported by QxWindow!");
};

proto._layoutInternalWidgetsHorizontal = proto._layoutInternalWidgetsVertical = function() {
  return true;
};

proto._modifyElement = function(propValue, propOldValue, propName, uniqModIds)
{
  if (propValue)
  {
    // this will add the class QxAtomBase to all widgets
    // which extends QxAtom.
    this._addCssClassName("QxAtomBase");

    // Create icon if needed.
    if (this._displayIcon && !this._icon) {
      this._pureCreateFillIcon();
    };

    // Create caption if needed.
    if (this._displayCaption && !this._caption) {
      this._pureCreateFillCaption();
    };

    // Create Buttons if needed.
    if (this.getShowMinimize() && !this._minimizeButton) {
      this._pureCreateFillMinimizeButton();
    };

    if (this.getShowMaximize())
    {
      if (!this._restoreButton) {
        this._pureCreateFillRestoreButton();
      };

      if (!this._maximizeButton) {
        this._pureCreateFillMaximizeButton();
      };
    };

    if (this.getShowClose() && !this._closeButton) {
      this._pureCreateFillCloseButton();
    };
  };

  return QxWidget.prototype._modifyElement.call(this, propValue, propOldValue, propName, uniqModIds);
};





/*
------------------------------------------------------------------------------------
  MODIFIERS
------------------------------------------------------------------------------------
*/

proto._displayIcon = false;
proto._displayCaption = false;

proto._modifyActive = function(propValue, propOldValue, propName, uniqModIds)
{
  if (propValue)
  {
    this.addCssClassNameDetail("active");
    this._windowManager.setActiveWindow(this, uniqModIds);
  }
  else
  {
    this.removeCssClassNameDetail("active");
  };

  return true;
};

proto._checkState = function(propValue, propOldValue, propName, uniqModIds)
{
  if (!this.getResizeable() && (propOldValue != "minimized" || this._previousState != propValue)) {
    throw new Error("This state is not allowed: " + propValue + "!");
  };

  return propValue;
};

proto._modifyState = function(propValue, propOldValue, propName, uniqModIds)
{
  switch(propValue)
  {
    case "minimized":
      this._minimize();
      break;

    case "maximized":
      this._maximize();
      break;

    default:
      this._restore();
  };

  this._previousState = propOldValue;

  return QxPopup.prototype._modifyState.call(this, propValue, propOldValue, propName, uniqModIds);
};

proto._modifyShowButton = function(propValue, propOldValue, propName, uniqModIds)
{
  this._layoutCommands();
  return true;
};




/*
------------------------------------------------------------------------------------
  ALLOW COMMANDS
------------------------------------------------------------------------------------
*/

proto._modifyResizeable = function(propValue, propOldValue, propName, uniqModIds) {
  return this._applyAllowMaximize();
};

proto._modifyAllowMinimize = function(propValue, propOldValue, propName, uniqModIds) {
  return this._applyAllowMinimize();
};

proto._modifyModal = function(propValue, propOldValue, propName, uniqModIds) {
  return this._applyAllowMinimize();
};

proto._applyAllowMinimize = function()
{
  if (this._minimizeButton) {
    this._minimizeButton.setEnabled(this.getAllowMinimize() && !this.getModal());
  };

  return true;
};

proto._modifyAllowMaximize = function(propValue, propOldValue, propName, uniqModIds) {
  return this._applyAllowMaximize();
};

proto._applyAllowMaximize = function()
{
  var e = this.getAllowMaximize() && this.getResizeable() && (this.getMaxWidth() == null || this.getMaxWidth() == Infinity) && (this.getMaxHeight() == null || this.getMaxHeight() == Infinity);
  
  if (this._maximizeButton) {
    this._maximizeButton.setEnabled(e);
  };

  if (this._restoreButton) {
    this._restoreButton.setEnabled(e);
  };

  return true;
};

proto._modifyAllowClose = function(propValue, propOldValue, propName, uniqModIds) {
  return this._applyAllowClose();
};

proto._applyAllowClose = function()
{
  if (this._closeButton) {
    this._closeButton.setEnabled(this.getAllowClose());
  };

  return true;
};


/*
------------------------------------------------------------------------------------
  COMMANDS
------------------------------------------------------------------------------------
*/

proto._layoutCommands = function()
{
  var s = 0;

  if (this._closeButton)
  {
    if (this.getShowClose())
    {
      this._closeButton.setRight(s);

      if (this._captionbar._wasVisible) {
        this._closeButton.setVisible(true);
      };

      s += this._closeButton.getWidth() + 2;
    }
    else
    {
      this._closeButton.setVisible(false);
    };
  };

  if (this._maximizeButton && this._restoreButton)
  {
    if (this.getShowMaximize())
    {
      if (this.getState() == "maximized")
      {
        this._maximizeButton.setVisible(false);

        this._restoreButton.setRight(s);

        if (this._captionbar._wasVisible) {
          this._restoreButton.setVisible(true);
        };

        s += this._restoreButton.getWidth();
      }
      else
      {
        this._restoreButton.setVisible(false);

        this._maximizeButton.setRight(s);

        if (this._captionbar._wasVisible) {
          this._maximizeButton.setVisible(true);
        };

        s += this._maximizeButton.getWidth();
      };
    }
    else
    {
      this._maximizeButton.setVisible(false);
      this._restoreButton.setVisible(false);
    };
  };

  if (this._minimizeButton)
  {
    if (this.getShowMinimize())
    {
      this._minimizeButton.setRight(s);

      if (this._captionbar._wasVisible) {
        this._minimizeButton.setVisible(true);
      };
    }
    else
    {
      this._minimizeButton.setVisible(false);
    };
  };
};

proto._pureCreateFillCloseButton = function()
{
  var ob = this._closeButton = new QxButton(null, "widgets/window/close.gif");

  ob.set({ top: 0, height: 15, width: 16, tabIndex : -1 });
  ob.addEventListener("click", this._onclosebuttonclick, this);
  ob.addEventListener("mousedown", this._onbuttonmousedown, this);

  this._applyAllowClose();

  this._captionbar.add(ob);
};

proto._pureCreateFillMinimizeButton = function()
{
  var ob = this._minimizeButton = new QxButton(null, "widgets/window/minimize.gif");

  ob.set({ top: 0, height: 15, width: 16, tabIndex : -1 });
  ob.addEventListener("click", this._onminimizebuttonclick, this);
  ob.addEventListener("mousedown", this._onbuttonmousedown, this);

  this._applyAllowMinimize();

  this._captionbar.add(ob);
};

proto._pureCreateFillRestoreButton = function()
{
  var ob = this._restoreButton = new QxButton(null, "widgets/window/restore.gif");

  ob.set({ top: 0, height: 15, width: 16, tabIndex : -1 });
  ob.addEventListener("click", this._onrestorebuttonclick, this);
  ob.addEventListener("mousedown", this._onbuttonmousedown, this);

  this._applyAllowMaximize();

  ob._shouldBecomeCreated = function() {
    return this.getParent().getParent().getState() == "maximized";
  };

  this._captionbar.add(ob);
};

proto._pureCreateFillMaximizeButton = function()
{
  var ob = this._maximizeButton = new QxButton(null, "widgets/window/maximize.gif");

  ob.set({ top: 0, height: 15, width: 16, tabIndex : -1 });
  ob.addEventListener("click", this._onmaximizebuttonclick, this);
  ob.addEventListener("mousedown", this._onbuttonmousedown, this);

  this._applyAllowMaximize();

  ob._shouldBecomeCreated = function() {
    return this.getParent().getParent().getState() != "maximized";
  };

  this._captionbar.add(ob);
};




/*
------------------------------------------------------------------------------------
  CAPTION
------------------------------------------------------------------------------------
*/

proto._modifyCaption = function(propValue, propOldValue, propName, uniqModIds)
{
  var o = this._caption;
  
  if (this._updateUseCaption())
  {
    if (o)
    {
      o.setHtml(propValue);
      o.setParent(this._captionbar);
    }
    else
    {
      this._pureCreateFillCaption();
    };
  }
  else if (o)
  {
    o.setParent(null);
    o.setHtml(propValue);
  };

  return true;
};

proto._updateUseCaption = function() {
  return this._displayCaption = this.getCaption() && this.getShowCaption();
};

proto._pureCreateFillCaption = function()
{
  var o = this._caption = new QxContainer(this.getCaption());

  o.setTop(1);
  this._layoutCaption();

  o.setParent(this._captionbar);
};

proto._modifyShowCaption = function(propValue, propOldValue, propName, uniqModIds)
{
  var o = this._caption;

  if (this._updateUseCaption())
  {
    if (o)
    {
      o.setParent(this._captionbar);
    }
    else
    {
      this._pureCreateFillCaption();
    };
  }
  else if (o)
  {
    o.setParent(null);
  };

  return true;
};

proto._layoutCaption = function()
{
  if (!this._icon || !this._icon.isCreated()) {
    return;
  };
  
  if (this._caption) {
    this._caption.setLeft(this._displayIcon ? this._icon.getAnyWidth() + 3 : 0)
  };
};






/*
------------------------------------------------------------------------------------
  ICON
------------------------------------------------------------------------------------
*/

proto._modifyIcon = function(propValue, propOldValue, propName, uniqModIds)
{
  var o = this._icon;

  if (this._updateUseIcon())
  {
    if (o)
    {
      o.setSource(propValue);
      o.setParent(this._captionbar);
    }
    else
    {
      this._pureCreateFillIcon();
    };
  }
  else if (o)
  {
    o.setParent(null);
    o.setSource(propValue);
  };

  return true;
};

proto._updateUseIcon = function() {
  return this._displayIcon = this.getIcon() && this.getShowIcon();
};

proto._pureCreateFillIcon = function()
{
  var o = this._icon = new QxImage(this.getIcon(), this.getIconWidth(), this.getIconHeight());

  o.setLocation(1, 0);
  o.addEventListener("mousedown", this._oniconmousedown, this);
  o.addEventListener("load", this._oniconload, this);

  o.setParent(this._captionbar);
};

proto._modifyShowIcon = function(propValue, propOldValue, propName, uniqModIds)
{
  var o = this._icon;

  if (this._updateUseIcon())
  {
    if (o)
    {
      o.setParent(this._captionbar);
    }
    else
    {
      this._pureCreateFillIcon();
    };
  }
  else if (o)
  {
    o.setParent(null);
  };

  this._layoutCaption();

  return true;
};








/*
------------------------------------------------------------------------------------
  UTILITY
------------------------------------------------------------------------------------
*/

proto.close = function() {
  this.setVisible(false);
};

proto.open = function(vOpener)
{
  if (isValid(vOpener)) {
    this.setOpener(vOpener);
  };

  this.setVisible(true);
};

proto.focus = function() {
  this.setActive(true);
};

proto.blur = function() {
  this.setActive(false);
};



/*
------------------------------------------------------------------------------------
  USER ACCESS TO STATES
------------------------------------------------------------------------------------
*/

proto.maximize = function() {
  this.setState("maximized");
};

proto.minimize = function() {
  this.setState("minimized");
};

proto.restore = function() {
  this.setState(null);
};



/*
------------------------------------------------------------------------------------
  STATE LAYOUT IMPLEMENTATION
------------------------------------------------------------------------------------
*/

proto._previousState = null;

proto._minimize = function()
{
  this.blur();
  this.setVisible(false);
};

proto._restore = function()
{
  if (this.getVisible()) {
    this._omitRendering();
  };

  this.setLeft(this._previousLeft ? this._previousLeft : null);
  this.setRight(this._previousRight ? this._previousRight : null);
  this.setTop(this._previousTop ? this._previousTop : null);
  this.setBottom(this._previousBottom ? this._previousBottom : null);

  this.setWidth(this._previousWidth ? this._previousWidth : null);
  this.setHeight(this._previousHeight ? this._previousHeight : null);

  this.getVisible() ? this._activateRendering() : this.setVisible(true);

  this._layoutCommands();
  this.focus();
};

proto._maximize = function()
{
  if (this.getVisible()) {
    this._omitRendering();
  };

  this._previousLeft = this.getLeft();
  this._previousWidth = this.getWidth();
  this._previousRight = this.getRight();

  this._previousTop = this.getTop();
  this._previousHeight = this.getHeight();
  this._previousBottom = this.getBottom();

  this.setWidth(null);
  this.setLeft(0);
  this.setRight(0);

  this.setHeight(null);
  this.setTop(0);
  this.setBottom(0);

  this.getVisible() ? this._activateRendering() : this.setVisible(true);

  this._layoutCommands();
  this.focus();
};






/*
------------------------------------------------------------------------------------
  EVENTS
------------------------------------------------------------------------------------
*/

proto._onwindowmousedown = function(e) 
{
  this.focus();
  
  if (this._resizeMode)
  {
    this.setCapture(true);
    
    this._resizeActive = true;
    this._resizeFirst = true;
    
    var pa = this.getParent();
    this._resizeParentOffsetX = pa.getComputedPageBoxLeft() + pa.getComputedBorderLeft();
    this._resizeParentOffsetY = pa.getComputedPageBoxTop() + pa.getComputedBorderTop();
    this._resizeParentOffsetRight = pa.getComputedPageBoxRight() - pa.getComputedBorderRight();
    this._resizeParentOffsetBottom = pa.getComputedPageBoxBottom() - pa.getComputedBorderBottom();
  }
  else
  {
    delete this._resizeActive;
  };
};

proto._onwindowmouseup = function(e) 
{
  if (this._resizeActive)
  {
    this.setCapture(false);
    
    delete this._resizeActive; 
    delete this._resizeMode;
    delete this._resizeFirst;
    
    if (this._resizeFrame && this._resizeFrame.getParent())
    {
      this.setLeft(this._resizeFrame.getComputedPageBoxLeft() - this._resizeParentOffsetX);
      this.setTop(this._resizeFrame.getComputedPageBoxTop() - this._resizeParentOffsetY);
      this.setWidth(this._resizeFrame.getComputedBoxWidth());
      this.setHeight(this._resizeFrame.getComputedBoxHeight());
      
      this._resizeFrame.setParent(null);     
    };    
    
    delete this._resizeParentOffsetX;
    delete this._resizeParentOffsetY;
  };
};

proto._near = function(p, e) {
  return e > (p - 5) && e < (p + 5);
};

proto._onwindowmousemove = function(e) 
{
  if (!this.getResizeable() || this.getState() != null) {
    return;
  };
  
  if (this._resizeActive)
  {
    var l, t, w, h;

    var f = this._resizeFrame;

    switch(this._resizeMode)
    {
      case "nw":
      case "sw":
      case "w":
        l = Math.max( e.getPageX(), this._resizeParentOffsetX );
        w = this.getComputedBoxWidth() + this.getComputedPageBoxLeft() - l;
        
        // handle limits
        w = w.limit(this.getMinWidth(), this.getMaxWidth());
        l = this.getComputedPageBoxRight() - w;
        break;
      
      case "ne":
      case "se":
      case "e":
        l = this.getComputedPageBoxLeft();
        w = Math.min( e.getPageX(), this._resizeParentOffsetRight ) - l;
        
        // handle limits
        w = w.limit(this.getMinWidth(), this.getMaxWidth());
        break;
        
      default:
        if (this._resizeFirst) {
          l = this.getComputedPageBoxLeft();
          w = this.getComputedBoxWidth();
        };
    };
    
    switch(this._resizeMode)
    {
      case "nw":
      case "ne":
      case "n":
        t = Math.max( e.getPageY(), this._resizeParentOffsetY );
        h = this.getComputedBoxHeight() + this.getComputedPageBoxTop() - t;
        
        // handle limits
        h = h.limit(this.getMinHeight(), this.getMaxHeight());
        t = this.getComputedPageBoxBottom() - h;
        break;
      
      case "sw":
      case "se":
      case "s":
        t = this.getComputedPageBoxTop();
        h = Math.min( e.getPageY(), this._resizeParentOffsetBottom ) - t;
        
        // handle limits
        h = h.limit(this.getMinHeight(), this.getMaxHeight());
        break;
        
      default:
        if (this._resizeFirst) 
        {
          t = this.getComputedPageBoxTop();
          h = this.getComputedBoxHeight();     
        };        
    };
    
    if (typeof l != "undefined") {
      f._applyPositionHorizontal(l - this._resizeParentOffsetX );
    };
    
    if (typeof t != "undefined") {
      f._applyPositionVertical(t - this._resizeParentOffsetY);
    };
    
    if (typeof w != "undefined") {
      f._applySizeHorizontal(w);
    };
    
    if (typeof h != "undefined") {
      f._applySizeVertical(h);
    };

    // Apply current to use parent and adjust zIndex
    if (this._resizeFirst) 
    {
      f.setZIndex(this.getZIndex() + 1);
      f.setParent(this.getParent());
      
      delete this._resizeFirst;
    };
  }
  else
  {
    var resizeMode = "";
    
    if (this._near(this.getComputedPageBoxTop(), e.getPageY())) {
      resizeMode = "n";
    }
    else if (this._near(this.getComputedPageBoxBottom(), e.getPageY())) {
      resizeMode = "s";
    };
    
    if (this._near(this.getComputedPageBoxLeft(), e.getPageX())) {
      resizeMode += "w";
    }
    else if (this._near(this.getComputedPageBoxRight(), e.getPageX())) {
      resizeMode += "e";  
    };
    
    if (resizeMode != "")
    {
      this._resizeMode = resizeMode;
      this.setCursor(resizeMode + "-resize");
    }
    else
    {
      delete this._resizeMode;
      this.setCursor(null);
    };
  };
};

proto._oniconmousedown = function(e) {
  e.stopPropagation();
};

proto._onbuttonmousedown = function(e) {
  e.stopPropagation();
};

proto._oniconload = function(e) {
  this._layoutCaption();
};



/*
------------------------------------------------------------------------------------
  CAPTION EVENTS
------------------------------------------------------------------------------------
*/

proto._oncaptionmousedown = function(e)
{
  if (e.isNotLeftButton() || !this.getMoveable() || this.getState() != null) {
    return;
  };

  // enable capturing
  this._captionbar.setCapture(true);

  // measuring and caching of values for drag session
  var pa = this.getParent();
  
  var l = pa.getComputedPageAreaLeft();
  var t = pa.getComputedPageAreaTop();
  var r = pa.getComputedPageAreaRight();
  var b = pa.getComputedPageAreaBottom();
  
  this._dragSession =  
  {
    offsetX : e.getPageX() - this.getComputedPageBoxLeft() + l,
    offsetY : e.getPageY() - this.getComputedPageBoxTop() + t,

    parentAvailableAreaLeft : l + 5,
    parentAvailableAreaTop : t + 5,
    parentAvailableAreaRight : r - 5,
    parentAvailableAreaBottom : b - 5      
  };
};

proto._oncaptionmouseup = function(e)
{
  var s = this._dragSession;
  
  if (!s) {
    return;
  };
  
  // disable capturing
  this._captionbar.setCapture(false);

  // move window to last position
  if (isValidNumber(s.lastX)) {  
    this.setLeft(s.lastX);
  };
  
  if (isValidNumber(s.lastY)) {
    this.setTop(s.lastY);  
  };  
  
  // cleanup session
  delete this._dragSession;
};

proto._oncaptionmousemove = function(e)
{
  var s = this._dragSession;
  
  // pre check for active session and capturing
  if (!s || !this._captionbar.getCapture()) {
    return;
  };

  // pre check if we go out of the available area  
  if (!e.getPageX().inrange(s.parentAvailableAreaLeft, s.parentAvailableAreaRight) || !e.getPageY().inrange(s.parentAvailableAreaTop, s.parentAvailableAreaBottom)) {
    return; 
  };

  // use the fast and direct dom methods
  this._applyPositionHorizontal(s.lastX = e.getPageX() - s.offsetX);
  this._applyPositionVertical(s.lastY = e.getPageY() - s.offsetY);
};




/*
------------------------------------------------------------------------------------
  BUTTON EVENTS
------------------------------------------------------------------------------------
*/

proto._onminimizebuttonclick = function(e)
{
  this.minimize();
  e.stopPropagation();
};

proto._onrestorebuttonclick = function(e)
{
  this.restore();
  e.stopPropagation();
};

proto._onmaximizebuttonclick = function(e)
{
  this.maximize();
  e.stopPropagation();
};

proto._onclosebuttonclick = function(e)
{
  this.close();
  e.stopPropagation();
};






/*
------------------------------------------------------------------------------------
  DISPOSER
------------------------------------------------------------------------------------
*/

proto.dispose = function()
{
  if (this.getDisposed()) {
    return;
  };
  
  

  this.removeEventListener("mousedown", this._onwindowmousedown, this);
  this.removeEventListener("mouseup", this._onwindowmouseup, this);
  this.removeEventListener("mousemove", this._onwindowmousemove, this);


  var w = this._caption;
  if (w)
  {
    w.dispose();
    this._caption = null;
  };

  w = this._icon;
  if (w)
  {
    w.removeEventListener("mousedown", this._oniconmousedown, this);
    w.dispose();
    
    this._icon = null;
  };

  w = this._closeButton;
  if (w)
  {
    w.removeEventListener("click", this._onclosebuttonclick, this);
    w.removeEventListener("mousedown", this._onbuttonmousedown, this);

    w.dispose();
    this._closeButton = null;
  };

  w = this._restoreButton;
  if (w)
  {
    w.removeEventListener("click", this._onrestorebuttonclick, this);
    w.removeEventListener("mousedown", this._onbuttonmousedown, this);

    w.dispose();
    this._restoreButton = null;
  };

  w = this._maximizeButton;
  if (w)
  {
    w.removeEventListener("click", this._onmaximizebuttonclick, this);
    w.removeEventListener("mousedown", this._onbuttonmousedown, this);

    w.dispose();
    this._maximizeButton = null;
  };

  w = this._minimizeButton;
  if (w)
  {
    w.removeEventListener("click", this._onminimizebuttonclick, this);
    w.removeEventListener("mousedown", this._onbuttonmousedown, this);

    w.dispose();
    this._minimizeButton = null;
  };




  w = this._captionbar;
  if (w)
  {
    w.removeEventListener("mousedown", this._oncaptionmousedown, this);
    w.removeEventListener("mouseup", this._oncaptionmouseup, this);
    w.removeEventListener("mousemove", this._oncaptionmousemove, this);

    w.dispose();
    this._captionbar = null;
  };

  w = this._pane;
  if (w)
  {
    w.dispose();
    this._pane = null;
  };

  w = this._statusbar;
  if (w)
  {
    w.dispose();
    this._statusbar = null
  };
};