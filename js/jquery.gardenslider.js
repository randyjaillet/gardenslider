/*
** A gracefully degrading, mobile-first navigation jQuery plugin.
** 
** Gardenburger turns navigation lists into dynamic dropdowns and
** flyouts. These menus are all keyboard accessible. Gardenburger
** is mobile friendly and will transmogrify in mobile mode (at
** < 800px by default) into a set of stacked, indented lists that
** are hidden beneath a "hamburger" icon. Buttons are injected in
** mobile mode for expanding and collapsing menus, as the "hover"
** event can't be relied upon in touch screen environments.
*/

// Keep track of our instantiated gardenburgers in case we need
// to manipulate them later
window.gardenburgers = [];

var Gardenburger = function ($e, options) {
	
	options = options || {};

	// If options is a string (as it is when taken from
	// an HTML attribute), parse it into an object
 	typeof options == "string" && (options = $.parseJSON(options));

	this.settings = $.extend(
		{
	    	breakpoint				: 800,
	    	sectionParentsAreActive	: true
		},
		options
	);

	window.gardenburgers.push(this);
	
	var root = this;
	this.i = $(window.gardenburgers).index(this);
	this.e = $e;
	
	this.init();
	
}



Gardenburger.prototype.init = function () {
	var root = this;

	this.e
	

			// Since the focus event doesn't bubble
			// up to the LI tags, use event delegation
			// to apply a class for the CSS to target
			// instead. Also, trigger a custom event
			// for the JS side of things.

			.on(
    			"focus",
    			"a",
    			function (e) {
					$(e.target).parents("li").addClass("focus");
					$(e.target).trigger("bubblyfocus");
				}
			)
			.on(
    			"blur",
    			"a",
    			function(e){
					$(e.target).parents("li").removeClass("focus");
				}
			)


			// Since a parent selector (:has()?) in CSS
			// is currently a distant fantasy, apply a
			// class to LIs that contain submenus. Close
			// them for initial state.

			.find("li:has(ul)")
					.addClass("hasChildMenu closed")
					.end() // Back to context


			// Touch handling
			// If the link of a menu item with a dropdown
			// is tapped (touch), the first tap will open
			// the menu (via .focus). It will require a
			// second tap to follow the href.
			
			.on(
				"touchend",
				"li.hasChildMenu > a",
				function (e) {
					if (root.settings.sectionParentsAreActive) {
						if (!$(e.target).data("tappedOnce") && $(window).width() >= root.settings.breakpoint) {
							e.preventDefault();
	
							$(e.target).data("tappedOnce",true);
		
							$(document).on(
								"touchstart.tapCountReset" + root.i,
								function (e2) {
									if ( !$(e2.target).is($(e.target)) && !$(e2.target).closest($(e.target)).length ) {
										$(e.target).data("tappedOnce",false).blur();
										root.e.off("touchstart.tapCountReset" + root.i);
									}
								}
							);
	
						}
					}
				}
			)
			
			
			// If section parents are set to be inactive,
			// disable their click behavior on desktop
			// mode. In mobile mode, trigger opening the
			// submenu on click.
			
			.on(
				"click",
				"li.hasChildMenu > a",
				function (e) {
					if (!root.settings.sectionParentsAreActive) {
						e.preventDefault();
						$(window).width() < root.settings.breakpoint && $(e.target).closest("li").children(".submenuTogglers").click();
					}
				}
			)


			// Apply click event handling to the mobile
			// menu button to handle visibility of
			// navigation.

			.on(
				"click",
				".burger a",
				function (e) {
					e.preventDefault();
					root.e.is(".mobileHide") ? root.showMenuMobileInline.apply(root) : root.hideMenuMobileInline.apply(root);
				}
			)


			// Inject togglers for hiding/showing sub
			// menus in mobile mode and attach their
			// event handlers.

			.find("li.hasChildMenu")
					.each(
						function (i, el) {
			    			$(this).children("a").after("<button class=\"submenuTogglers\"><i></i></button>");
			    		}
			    	)
			    	.end() // Back to context

			.on(
				"click",
				".submenuTogglers",
				function (e) {
					var $li = $(e.target).closest("li");
					var $ul = $li.children("ul").eq(0);
					e.preventDefault();

					$li.is(".closed") ? root.showSubmenuMobile($ul) : root.hideSubmenuMobile($ul);
				}
			)
	;


	// Position the menus now and on resize.

	root.positionMenus();
	$(window).on(
		"resize",
		function () {
			root.positionMenus()
		}
	);
	
	// Start the nav hidden in mobile.
	
	root.e.addClass("mobileHide");


	// Remove focus from menu items so the dropdowns
	// close if user taps on document outside of
	// said menu.

	$(document).on(
		"touchstart",
		function () {
			root.e.find(":focus").blur();
		}
	);
	
}



Gardenburger.prototype.showSubmenuMobile = function ($menu) {
	var
		root = this,
		visHeight = $menu.outerHeight(),
		animationEvent = whichAnimationEvent()
	;

	if (!$menu.data("animating")) {
		$menu
				// Turn on the flag that prevents animations
				// from interrupting each other or queuing up.
				// This ensures this animation will complete.
				.data("animating", true)

				// Set a fixed height equal to its current height
				// so the transition has a "to" point.
				.css("height", visHeight)

				// Add the class that styles the opening
				// section so its transition will start and
				// take place at the same time as the opening
				// animation below. (This class controls the
				// shading of the submenu and the flipping
				// of the submenu indicator arrow.)
				.closest("li")
						.addClass("opening")
						.removeClass("closed")
						.end()

				// Animates the height from 0 to the inline
				// height we specified above.
				.addClass("animateHeightToInline")

				// Once the animation finishes...
				.one(
					animationEvent,
					function () {
						$menu
								// Remove the fixed inline
								// height that was added to
								// give the transition a "to"
								// point. If we need it later
								// we'll measure anew since we
								// always want the current height
								// anyway (it might change if
								// submenus are expanded/closed).
								.attr("style","")
								
								// We don't need the class that
								// animates it anymore.
								.removeClass("animateHeightToInline")

								// Turn off the flag that prevents
								// animations from interrupting
								// each other or queuing up.
								.data("animating", false)
						;
					}
				)
		;
	}
}



Gardenburger.prototype.hideSubmenuMobile = function ($menu) {
	var
		root = this,
		visHeight = $menu.outerHeight(),
		transitionEvent = whichTransitionEvent()
	;

	if (!$menu.data("animating")) {
		$menu
				// Turn on the flag that prevents animations
				// from interrupting each other or queuing up.
				// This ensures this animation will complete.
				.data("animating", true)

				// Remove the class that styles the open
				// section so its transition will start and
				// take place at the same time as the closing
				// animation below. (This class controls the
				// shading of the submenu and the flipping
				// of the submenu indicator arrow.)
				.closest("li")
						.removeClass("opening")
						.end()
				
				// Set a fixed height equal to its current height
				// so the transition has a "from" point, since we
				// can't tell it to transition from "whatever the
				// current unknown value is."
				.css("height", visHeight)
		;

		// Removing this breaks the transition. Whyyyyyy???
		console.log($menu.css("height"));

		$menu
				// Begin the transition to 0 height
				.addClass("height0")

				// Once the transition finishes...
				.one(
					transitionEvent,
					function () {
						$menu
								// Remove the fixed inline
								// height that was added to
								// give the transition a "from"
								// point. If we need it later
								// we'll measure anew since we
								// always want the current height
								// anyway (it might change if
								// submenus are expanded/closed).
								.attr("style","")

								// Hide the menu offscreen now
								// that it's done animating
								.closest("li")
										.addClass("closed")
										.end()
								
								// Now that the menu is offscreen
								// we can get rid of the class
								// that set the height to 0. We
								// want it to have an accurate
								// open state height so that it
								// will be measurable next time.
								.removeClass("height0")
								
								// Turn off the flag that prevents
								// animations from interrupting
								// each other or queuing up.
								.data("animating", false)
						;
					}
				)
		;
	}
}



Gardenburger.prototype.showMenuMobileInline = function () {
	var
		root = this,
		$nav = this.e.children("ul:last"),
		visHeight = $nav.outerHeight(),
		animationEvent = whichAnimationEvent()
	;
	
	if (!$nav.data("animating")) {
		
		// Begin the burger's animation to an X
		root.e.find(".burger").addClass("ex");
		
		$nav
				// Turn on the flag that prevents animations
				// from interrupting each other or queuing up.
				// This ensures this animation will complete.
				.data("animating", true)

				// Set a fixed height equal to its current height
				// so the transition has a "to" point.
				.css("height", visHeight)

				// Bring the nav onscreen.
				.closest(root.e)
						.removeClass("mobileHide")
						.end()

				// Animates the height from 0 to the inline
				// height we specified above.				
				.addClass("animateHeightToInline")
				
				// Once the animation finishes...
				.one(
					animationEvent,
					function () {
						$nav
								// Remove the fixed inline
								// height that was added to
								// give the transition a "to"
								// point. If we need it later
								// we'll measure anew since we
								// always want the current height
								// anyway (it might change if
								// submenus are expanded/closed).
								.attr("style","")

								// We don't need the class that
								// animates it anymore.
								.removeClass("animateHeightToInline")

								// Turn off the flag that prevents
								// animations from interrupting
								// each other or queuing up.
								.data("animating", false)
						;
					}
				)
		;		
	}
}



Gardenburger.prototype.hideMenuMobileInline = function () {
	var
		root = this,
		$nav = this.e.children("ul:last"),
		visHeight = $nav.outerHeight(),
		transitionEvent = whichTransitionEvent()
	;

	if (!$nav.data("animating")) {

		// Begin the burger's animation from an X
		root.e.find(".burger").removeClass("ex");
		
		$nav
				// Turn on the flag that prevents animations
				// from interrupting each other or queuing up.
				// This ensures this animation will complete.
				.data("animating", true)
				
				// Set a fixed height equal to its current height
				// so the transition has a "from" point, since we
				// can't tell it to transition from "whatever the
				// current unknown value is."
				.css("height", visHeight)
		;
		
		// Removing this breaks the transition. Whyyyyyy???
		console.log($nav.css("height"));

		$nav
				// Begin the transition to 0 height
				.addClass("height0")

				// Once the transition finishes...
				.one(
					transitionEvent,
					function () {
						
						// Hide the nav offscreen now
						// that it's done animating.
						root.e.addClass("mobileHide");

						$nav
								// Remove the fixed inline
								// height that was added to
								// give the transition a "from"
								// point. If we need it later
								// we'll measure anew since we
								// always want the current height
								// anyway (it might change if
								// submenus are expanded/closed).
								.attr("style","")

								// Now that the nav is offscreen
								// we can get rid of the class
								// that set the height to 0. We
								// want it to have an accurate
								// open state height so that it
								// will be measurable next time.
								.removeClass("height0")
								
								// Turn off the flag that prevents
								// animations from interrupting
								// each other or queuing up.
								.data("animating", false)
						;
					}
				)
		;
	}
}



Gardenburger.prototype.positionMenus = function () {
	var root = this;
	
	this.e

			// Reset previously flipped menus.
			.find(".flip")
					.removeClass("flip")
					.end()

			// Remove previously injected positioning wrappers.
			.find(".menuPositioningWrapper > ul")
					.unwrap()
					.end()

			// Go through second-level menus and figure out their
			// positioning first, since it's a little different
			// (they get nudged to the sides by the needed number
			// of pixels to keep them fully on-screen) and
			// because lower menus' positions depend on how we
			// adjust these higher ones'.
			// We're storing the horizontal position at which
			// menus would be if they were visible in the
			// "visiblePosX" data key.
			.find("ul:first > li > ul, ul:first > li > .menuPositioningWrapper > ul")
					.each(
						function () {
							var neededOffsetRight,
								siblingLinkOffsetLeft
							;

							if ($(this).closest(".menuPositioningWrapper").length) {
								siblingLinkOffsetLeft = $(this).closest(".menuPositioningWrapper").prevAll("a").offset().left;
							} else {
								siblingLinkOffsetLeft = $(this).prevAll("a").offset().left;
							}

							$(this).data("visiblePosX", siblingLinkOffsetLeft);

							neededOffsetRight = $(this).data("visiblePosX") + $(this).outerWidth() - $(window).width();

							if (neededOffsetRight > 0) {

								$(this)
										.wrap("<div class=\"menuPositioningWrapper\"></div>")
										.closest(".menuPositioningWrapper")
												.css({ "transform" : "translateX(-" + neededOffsetRight + "px)" })
												.end() // back to $(this) menu
										.data("visiblePosX", siblingLinkOffsetLeft - neededOffsetRight);
								;
							}

						}
					)

					// Go through third-and-deeper-level menus.
					// They just get flipped if there isn't 
					// enough room for them.
					.find("ul")
							.each(
								function () {
									var $parentMenu = $(this).parents("ul").first();
	
									$(this).data("visiblePosX", $parentMenu.data("visiblePosX") + $parentMenu.outerWidth());
	
									if ($(this).data("visiblePosX") + $(this).outerWidth() > $(window).width()) {
										$(this).addClass("flip");
										$(this).data("visiblePosX", $parentMenu.data("visiblePosX") - $(this).outerWidth());
									} else {
										$(this).removeClass("flip");
										$(this).data("visiblePosX", $parentMenu.data("visiblePosX") + $parentMenu.outerWidth());
									}
	
								}
							)
	;
}



/* From Modernizr */
function whichAnimationEvent(){
    var t;
    var el = document.createElement('fakeelement');
    var animations = {
		'animation':'animationend',
		'OAnimation':'oAnimationEnd',
		'MozAnimation':'animationend',
		'WebkitAnimation':'webkitAnimationEnd'
    }

    for (t in animations) {
        if ( el.style[t] !== undefined ) {
            return animations[t];
        }
    }
}
function whichTransitionEvent(){
    var t;
    var el = document.createElement('fakeelement');
    var transitions = {
		'transition':'transitionend',
		'OTransition':'oTransitionEnd',
		'MozTransition':'transitionend',
		'WebkitTransition':'webkitTransitionEnd'
    }

    for (t in transitions) {
        if ( el.style[t] !== undefined ) {
            return transitions[t];
        }
    }
}




// Plugin for ease of instantiation.
// Priority is on options passed in
// argument followed by those in HTML
// attribute.
$.fn.gardenburger = function (options) {

    return this.each(
    	function() {

			new Gardenburger(
				$(this),
				options || $(this).data("gardenburger-options")
			);

		}
	);

};




// Auto-instantiation based on HTML attributes
$(
	function () {
		$("[data-gardenburger]").each(
			function () {
				$(this).gardenburger();
			}
		);		
	}
);