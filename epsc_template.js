/**
@file
Main JS for the EPSC site.*/

Drupal.behaviors.epsc = {
  attach: function (context, settings) {
    jQuery('.grid').masonry({
      // Options.
      itemSelector: '.grid-item',
      columnWidth: 366,
      gutter: 3
    });
    jQuery('.node-type-epsc-basic-page .node-epsc-basic-page .box-border a').each(function () {
      that = jQuery(this);
      href = that.attr('href');
      a_content = jQuery(that).html();
      box = that.closest('.box-border');
      that.replaceWith(a_content);
      jQuery(box).wrap('<a href="' + href + '"/>');
    })

    jQuery('#edit-europa-search-submit').val('');

    jQuery('.page-file .region-content .file').addClass('btn btn-primary btn-large');

// FIRST THINGS FIRST
// hide 'Slider' (we could also completeley remove it from the
// DOM later to be really clean - for debugging better to leave in.)
jQuery('#block-views-homepage-slider-block').hide();

// ***************
// *   OPTIONS   *
// ***************
var opt_slideDuration = 6; // slide duration in seconds
var opt_transitionDuration = 1.5; // transition duration in seconds.

var opt_contentOverlayColor = "rgba(0, 0, 0, 0.45)";
var opt_bgOverlayColor = "rgba(0, 0, 0, 0.0)";

// ******************
// *  END: OPTIONS  *
// ******************.
// *********************
// *  ANIMATION SETUP  *
// *********************
//
// The idea here is to calculate keyframes based on two basic parameters
// - opt_slideDuration and opt_transitionDuration. The script takes the durations
// in seconds and recalculates them to % of the total duration for CSS
// animation keyframes.
//
// DIV.slider takes 100% of window width but contains a DIV.slides-container,
// which overflows and has the combined width of all the slides.
// By offsetting its left position, we effectively animate the slides.
//
// Note: Animating with jQuery might be simpler, but CSS animations should
// (hopefully) perform better.
// Get items from 'Slider' - we will call them slides when rendered, but 'items' until then.
var items = jQuery('#block-views-homepage-slider-block').find('.views-row');

// Set dimensions: the slider extends the window width - Each slide is 100% of the window width.
var sliderWidth = items.length * 100;
var slideWidth = 100 / items.length;

// Antimation calculations
var animationDuration = items.length * (opt_slideDuration + opt_transitionDuration); // total animation duration (all slides - will loop infinitely)
var durationBase = 100 / items.length; // the base total slide duration (including transition) in %
var durationKey = durationBase * (1 - (opt_transitionDuration / opt_slideDuration)); // the base slide duration WITHOUT the transition as %.
var animationFrames = [{}]; animationFrames[0].start = 0;   // an array of objects - each will be assigned a .start, .stop, and .offset value. (Constructor could be used.)

// Offset is the CSS left value for each slide
var animationRule = ''; // will be used for the CSS rule string
var animating = true; // flags whether slider animation is ongoing.

// For each item, create animation parameters.
for (i = 0; i <= items.length; i++) {

  if (i === items.length) {
    animationFrames[i].offset = 0;
  }
else {
    animationFrames[i].offset = i * -100;
  }

  animationFrames[i].stop = animationFrames[i].start + durationKey;
  animationFrames[i + 1] = {}
  animationFrames[i + 1].start = (i + 1) * durationBase;

}

for (i = 0; i < animationFrames.length; i++) { // Compose string for the CSS rule.

  if (!(animationFrames[i].start > 100)) {

    animationRule += animationFrames[i].start + '% { left: ' + animationFrames[i].offset + '%; } '

    if (!(animationFrames[i].stop > 100)) {
      animationRule += animationFrames[i].stop + '% { left: ' + animationFrames[i].offset + '%; } ';
    }

  }

}

// **************************
// *  END: ANIMATION SETUP  *
// **************************.
// ***************
// *  CSS SETUP  *
// ***************.
// Adds additional (dynamic) slider CSS rules to the HTML head.
var cssRules = '\
@keyframes slider-animation { ' + animationRule + ' } \
\
.slider .slides-container { \
  width: ' + sliderWidth + '%;\
  animation: ' + animationDuration + 's slider-animation infinite; \
} \
\
.slider .slides-container .slide-ratio-wrapper { \
  width: ' + slideWidth + '%; \
} \
';

jQuery('<style>' + cssRules + '</style>').appendTo('head');

// ********************
// *  END: CSS SETUP  *
// ********************.
// *********************************
// *  DOM (HTML) ELEMENTS CREATION *
// *********************************.
// For now, we are using tags within the 'spotlight' items abstracts to extract
// info (e.g. take <H2> for subtitle, take first <a> for link...).
//
// This should be improved by creating a new content type 'slide' with appropriate
// fields for Title, Subtitle, Abstract, Link, but the principle will stay the same.
//
// Note: It would be an option to have Drupal render the slider HTML completely,
// but this way it is possible to disable this slider JS and still have
// a 'spotlight' section.
// Add slider DIV. <figure> tag used for semantics.
jQuery('.region.region-content').prepend('<div class="slider"><figure class="slides-container clearfix"></figure></div>');

// Slides will be stored as objects within an array. Ech slide also contains slide elements.
var slides = [];

function slide(targetUrl, bgImgSrc, bgOverlayColor, contentOverlayColor) {
  this.targetUrl = targetUrl;
  this.bgImgSrc = bgImgSrc;
  this.bgOverlayColor = bgOverlayColor;
  this.contentOverlayColor = contentOverlayColor;
  this.content = [];
}

function slideElement(cssClass, outerTag, innerHtml) {
  this.class = cssClass;
  this.outerTag = outerTag;
  this.innerHtml = innerHtml;
}

// For each item, create a slide.
jQuery(items).each(function (i) {

  // Get target url.
  var targetUrl = jQuery(this).find('.views-field-field-target-url .field-content a').html();
  targetUrl = targetUrl ? targetUrl : '';

  var bgImgSrc = jQuery(this).find('.views-field-field-bg-img-src img').attr('src');

  // Get bgOverlayColor.
  var bgOverlayColor = jQuery(this).find('.views-field-field-bg-overlay-color .field-content').html();
  // Get contentOverlayColor.
  var contentOverlayColor = jQuery(this).find('.views-field-field-content-overlay-color .field-content').html();

  // Apply default overlay colours if custom colours not defined for this slide.
  contentOverlayColor = contentOverlayColor ? contentOverlayColor : opt_contentOverlayColor;
  bgOverlayColor = bgOverlayColor ? bgOverlayColor : opt_bgOverlayColor;

  slides[i] = new slide(targetUrl, bgImgSrc, bgOverlayColor, contentOverlayColor);

  var freeContent = jQuery(this).find('.free-content').html();
  if (freeContent) {
    slides[i].content.push(new slideElement('slide-free-content', 'div', freeContent));
  } else { // other elements are only displayed if free content is not provided

    var title = jQuery(this).find('h3').text();
    if (title) {
      slides[i].content.push(new slideElement('slide-title', 'div', title));
    }

    var subtitle = jQuery(this).find('.views-field-field-slider-subtitle').find('.field-content').html();
    if (subtitle) {
      slides[i].content.push(new slideElement('slide-subtitle', 'div', subtitle));
    }

    var text = jQuery(this).find('.views-field-field-slider-description').find('.field-content').html();
    if (text) {
      slides[i].content.push(new slideElement('slide-text', 'div', text));
    }

  }

});

for (var i = 0; i < slides.length; i++) {
  // Prepare slide HTML.
  var contentHtml = '';

  for (var n = 0; n < slides[i].content.length; n++) {
    contentHtml = contentHtml + '\
      <' + slides[i].content[n].outerTag + ' class="' + slides[i].content[n].class + '">\
      ' + slides[i].content[n].innerHtml + ' \
      </div> \
    ';
  }

  var slideHtml = '\
    <div class="slide-ratio-wrapper"> \
      <div class="slide" id="slide-' + i + '" style="background-image: "> \
        <img class="load-container" style="display: none;" src="' + slides[i].bgImgSrc + '" data-bg-overlay-color="' + slides[i].bgOverlayColor + '"> \
        <div class="slide-content-container-outer" style="background-color: ' + slides[i].contentOverlayColor + '"> \
          <div class="slide-content-container-inner"> \
            ' + contentHtml + ' \
          </div> <!-- .slide-content-container-inner --> \
        </div> <!-- .slide-content-container-outer --> \
      </div> <!-- .slide --> \
    </div> <!-- .slide-ratio-wrapper --> \
  ';

  // If targetUrl not empty, wrap slide HTML in an A tag.
  if (slides[i].targetUrl) {
slideHtml = '<a href="' + slides[i].targetUrl + '">' + slideHtml + '</a>' }

  // Finally append slide HTML.
  jQuery('.slider figure.slides-container').append(slideHtml);
}

// *********************************
// *  BACKGROUND IMAGES MANAGEMENT *
// *********************************.
// Set (show) slide background-image only when loaded.
// A lazy loading logic could be implemented by loading images one by one from the first slide.
// To do: load image size according to the screen size. Corresponding Drupal image styles (sizes) need to be defined.
jQuery('body .load-container').load(function () {

  // Check whether the background image is defined.
  var imgUrl = jQuery(this).attr('src') !== 'undefined' ? jQuery(this).attr('src') : '';

  var bgOverlayColor = jQuery(this).data('bg-overlay-color');
  jQuery(this).parent().css('background', 'linear-gradient(' + bgOverlayColor + ', ' + bgOverlayColor + '), url("' + imgUrl + '")');
  jQuery(this).parent().css('background-size', 'cover');
  jQuery(this).remove();

});

// **************************************
// *  END: BACKGROUND IMAGES MANAGEMENT *
// **************************************.
// *****************************
// *  SLIDER CONTROL ELEMENTS  *
// *****************************.
// Simply put, control elements are the little dots (actual visual presentation
// can be changed via CSS) to switch between slides manually.
//
// When a control element is clicked, the looping slider animtion is stopped
// and slider offset is animated with jQuery.
//
// To do: implement touch gestures (swipe to switch)
// Create DOM elements.
jQuery('.slider').append('<div class="slider-controls"></div>');

// For each slide, create a control butotn.
jQuery(items).each(function (i) {
  jQuery('.slider-controls').append('<div class="slider-switch" data-switch="' + i + '"></div>'); // data-switch holds the index of the corresponding slide.
  jQuery('.slider-switch').first().addClass('selected');
});

// CONTROLS BEHAVIOUR.
jQuery('.slider-switch').click(function () {

  // Stop slider animation.
  jQuery('.slides-container').css("animation", "none");

  // Since every slide is offset by -100%, we just multiply that by that by the index of the target slide.
  var targetOffset = jQuery(this).data('switch') * -100;
  jQuery('.slides-container').animate({ left: targetOffset + '%' }, 500);

  // Adds the selected class to the switch element, removes it from all others.
  jQuery('.slider-switch.selected').removeClass('selected');
  jQuery(this).addClass('selected');

  animating = false; // Animation flag (stopped)

});

// CONTROLS HIGHLIGHT.
// Instead of figuring out which slide is currently displayed (which would
// probably require a regular check on the slider offset and calculation),
// slider controls are 'animated' (through applying the .selected class)
// in sync with slider animation.
// This function is anonymous because the animation will not be resetarted -
// although it would be possible, the assumption is it would be detrimental
// to UX if the animation started again after the user actively stops it.
// For future reference, animationRule would have to be applied again to.
setInterval(function () {

  if (animating === true) {
    // If it is already the last switch that has the .selected class, apply it to the first one.
    if (jQuery('.slider-switch').last().hasClass('selected')) {
      jQuery('.slider-switch.selected').removeClass('selected');
      jQuery('.slider-switch').first().addClass('selected');
    }
else {
      jQuery('.slider-switch.selected').next().addClass('selected');
      jQuery('.slider-switch.selected').first().removeClass('selected');
    }
  }

}, (opt_slideDuration + opt_transitionDuration) * 1000);

// **********************************
// *  END: SLIDER CONTROL ELEMENTS  *
// **********************************
// ***************************
// *  SLIDER HEIGHT CONTROl  *
// ***************************
// By default, the slider height is set by CSS at a percentage of its width.
// (This is possible thanks to the fact that padding-bottom is calculated as
// % of the parent element width).
//
// This would be enough, except it may happen that the site admin creates
// a slide which has too much text.
//
// This function is designed to check the height of the inner slide content
// container and set the slider to accommodate for it, while keeping it at
// a minimum default % of the slider width.
function checkSliderHeight() {

  // Prepare variables.
  var tallestSlideContainerHeight = 0;
  var minSliderBottomPadding; // Will be expressed as 0.xx instead of xx% for simplicity.

  // Get slider width.
  var sliderWidth = jQuery('.slider').width();

  // Ensure the bottom padding fits the responsiveness otherwise set in CSS (but overriden by this JS script)
  if (sliderWidth >= 1340) {
    minSliderBottomPadding = 0.20;
  }
else if (sliderWidth < 1340 && sliderWidth >= 992) {
    minSliderBottomPadding = 0.25;
  }
else if (sliderWidth < 992 && sliderWidth >= 440) {
    minSliderBottomPadding = 0.35;
  }
else {
    minSliderBottomPadding = 0.70;
  }

  // The padding will actually be set in px, so we need to convert the % padding to
  // actual px padding for the current screen width in order to be able to compare the numbers.
  var minSliderHeight = minSliderBottomPadding * sliderWidth;

  // Check each slider for its content height, assign highest number to tallestSlideContainerHeight.
  jQuery('.slide-content-container-inner').each(function (index, slide) {
    var thisHeight = jQuery(slide).outerHeight(true);
    tallestSlideContainerHeight = thisHeight > tallestSlideContainerHeight ? thisHeight : tallestSlideContainerHeight;
  });

  // Check if the tallest container height is taller than the minimum (we do not want the slider to shrink too much)
  var newSliderBottomPadding = tallestSlideContainerHeight > minSliderHeight ? tallestSlideContainerHeight : minSliderHeight;

  // Apply new height as bottom padding (to all the slides)
  jQuery('.slide').css('padding-bottom', newSliderBottomPadding + 'px');

}

// Perform innitial height check.
checkSliderHeight();

// Bind height check to window resize.
jQuery(window).on('resize', function () {
  checkSliderHeight();
});

  (function ($) {
    jQuery.fn.checkEmpty = function () {
      var contentsHtml = jQuery(this).html().replace(/&nbsp;/g, '');
      return !jQuery.trim(contentsHtml).length;
    };
  }(jQuery));

  function toc() {
    if (jQuery('.contents').checkEmpty()) {
    jQuery('.contents').addClass('auto-generated-toc');

    // Add corresponding ID to all headings.
    jQuery('.field-items h2').each(function (i) {
      jQuery(this).attr('id', 'h-' + (i + 1));
    });

    // Cycle through H3s, assign IDs based on previous H2 (for subsections).
    jQuery('.field-items h3').each(function (i) {
      var parentId = jQuery(this).prevAll('.field-items h2').attr('id');
      if (parentId != null) {
        jQuery(this).attr('id', parentId + '-' + (i + 1));
      }
    });

    // Append TOC wrapper.
    jQuery('.contents').append('<div class=\'table-of-content-wrapper\'><ol></ol></div>');
    // Generate TOC.
    jQuery('.field-items h2').each(function (i) {
      var target = jQuery(this).attr('id');
      var text = jQuery(this).text();
      jQuery('.contents ol').first().append('<li><a href="#' + target + '">' + text + '</a><ol></ol></li>');

      jQuery(this).nextUntil('.field-items h2', '.field-items h3').each(function (i) {
        var target = jQuery(this).attr('id');
        var text = jQuery(this).text();
        jQuery('.table-of-content-wrapper > ol > li').last().find('ol').append('<li><a href="#' + target + '">' + text + '</a></li>');
      });
   });
  }
}

  jQuery(document).ready(function () {
    toc();
  });

  }
};
