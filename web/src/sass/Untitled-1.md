

Overview of Bulma

You only need 1 CSS file to use Bulma
CSS Masterclass

Bulma is a CSS library. This means it provides CSS classes to help you style your HTML code.

To use Bulma, you can either:

    use one of the pre-compiled .css files
    or install the .scss files so you can customize Bulma to your needs

Code requirements
#

For Bulma to work correctly, you need to make your webpage responsive.

1

Use the HTML5 doctype

<!DOCTYPE html>

2

Add the responsive viewport meta tag

<meta name="viewport" content="width=device-width, initial-scale=1">

Starter template
#

If you want to get started right away, you can use this HTML starter template. Just copy/paste this code in a file and save it on your computer.

<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Hello Bulma!</title>
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bulma@1.0.4/css/bulma.min.css">
  </head>
  <body>
  <section class="section">
    <div class="container">
      <h1 class="title">
        Hello World
      </h1>
      <p class="subtitle">
        My first website with <strong>Bulma</strong>!
      </p>
    </div>
  </section>
  </body>
</html>



How to install Bulma

Create your own theme with a simple set of variables
CSS Masterclass

Get the Bulma CSS file

A single .css file that includes all of Bulma

Option 1. Use a CDN

You can import the CSS file directly from jsDelivr:

@import "https://cdn.jsdelivr.net/npm/bulma@1.0.4/css/bulma.min.css";

Since the release of v1, the main version also works in RTL contexts, thanks to the use of logical properties. As a result, no separate RTL version of Bulma is developed anymore.

Bulma is also available via cdnjs.

Option 2. Download the Github release
You can get the latest Bulma release as a .zip from GitHub:

Or

Get the Bulma Sass library

A collection of .sass files to build your own version of Bulma

Option 1. Install the NPM package

Bulma is available through npm:

npm install bulma

Bulma is also available via cdnjs.

Option 2. Clone the GitHub repository

Bulma is available on GitHub:

git clone git@github.com:jgthms/bulma.git

Note that the GitHub repository also includes this documentation, so it’s significantly bigger than the NPM package. 

Alternative versions of Bulma

Use one of the pre-built alternative versions of Bulma
CSS Masterclass

Because different people have different requirements, Bulma comes in different versions ready to use:
Version 	Prefix 	Usage 	Download
Complete
(Library + Helpers) 	None 	

<section class="section">
  <div class="container has-text-centered">
    <h1 class="title">
      Hello World
    </h1>
    <p class="subtitle">
      My first website with
      <strong class="has-text-primary">Bulma</strong>!
    </p>
  </div>
</section>

Prefixed 	bulma- 	

<section class="bulma-section">
  <div class="bulma-container bulma-has-text-centered">
    <h1 class="bulma-title">
      Hello World
    </h1>
    <p class="bulma-subtitle">
      My first website with
      <strong class="bulma-has-text-primary">Bulma</strong>!
    </p>
  </div>
</section>

Library Only
No Helpers 	None 	

<section class="section">
  <div class="container">
    <h1 class="title">
      Hello World
    </h1>
    <p class="subtitle">
      My first website with
      <strong>Bulma</strong>!
    </p>
  </div>
</section>

No Helpers, Prefixed
Library Only 	bulma- 	

<section class="bulma-section">
  <div class="bulma-container">
    <h1 class="bulma-title">
      Hello World
    </h1>
    <p class="bulma-subtitle">
      My first website with
      <strong>Bulma</strong>!
    </p>
  </div>
</section>

No Dark Mode
Light Theme Only 	None 	

<section class="section">
  <div class="container has-text-centered">
    <h1 class="title">
      Hello World
    </h1>
    <p class="subtitle">
      My first website with
      <strong class="has-text-primary">Bulma</strong>!
    </p>
  </div>
</section>


Bulma’s Modifiers Syntax

How to use Bulma components and their alternative styles
CSS Masterclass

Let's start with a simple button that uses the "button" CSS class:

<button class="button">Button</button>

By adding the "is-primary" CSS class, you can modify the color:

<button class="button is-primary">Button</button>

You can use one of the 6 main colors:

    is-primary
    is-link
    is-info
    is-success
    is-warning
    is-danger

<button class="button is-primary">Button</button>
<button class="button is-link">Button</button>
<button class="button is-info">Button</button>
<button class="button is-success">Button</button>
<button class="button is-warning">Button</button>
<button class="button is-danger">Button</button>

You can also alter the size:

    is-small
    is-medium
    is-large

<button class="button is-small">Button</button>
<button class="button">Button</button>
<button class="button is-medium">Button</button>
<button class="button is-large">Button</button>

Or the style or state:

    is-outlined
    is-loading
    [disabled]

<button class="button is-primary is-outlined">Button</button>
<button class="button is-loading">Button</button>
<button class="button" disabled>Button</button>

As a result, it's very easy to combine modifiers:

<button class="button is-primary is-small" disabled>Button</button>
<button class="button is-info is-loading">Button</button>
<button class="button is-danger is-outlined is-large">Button</button>




Modularity in Bulma

Just import what you need
CSS Masterclass

Bulma consists of elements and components defined in dozens of .scss files, that you can load individually with the @use keyword.

@use "path/to/file.scss";

While this will correctly load the target file's styles, most Bulma components rely on base styles and CSS variables defined by the default themes.

That is why it's preferable to also load the sass/base folder and the sass/themes folder:

// Load Bulma's base styles and themes (including the minireset)
@use "bulma/sass/base";
@use "bulma/sass/themes";

// Load other Bulma components
@use "bulma/sass/elements/button";
@use "bulma/sass/components/message";

Importing columns
#

Layout features like Bulma's columns don't rely on CSS variables defined by Bulma themes. As a result, you can load them directly without requiring any additional file.

For example, importing Bulma columns only requires to load the file located in the bulma/sass/grid folder.

Simply load the columns.scss file with the @use keyword

// Only load the columns
@use "bulma/sass/grid/columns";

Now you can use the classes .columns (for the container) and .column directly:

<div class="columns">
  <div class="column">1</div>
  <div class="column">2</div>
  <div class="column">3</div>
  <div class="column">4</div>
  <div class="column">5</div>
</div>

Importing Bulma elements and components
#

To load Bulma elements like the .button and components like the .message, it's preferable to also load the base styles and default themes.

// Load Bulma's base styles and themes (including the minireset)
@use "bulma/sass/base";
@use "bulma/sass/themes";

// Load the button and title elements and components
@use "bulma/sass/elements/button";
@use "bulma/sass/elements/title";
@use "bulma/sass/components/message";

You can now use the .button class, and all its modifiers:

    .is-active
    .is-primary, .is-info, .is-success...
    .is-small, .is-medium, .is-large
    .is-outlined, .is-inverted, .is-link
    .is-loading, [disabled]

<button class="button">Button</button>
<button class="button is-primary">Primary button</button>
<button class="button is-large">Large button</button>
<button class="button is-loading">Loading button</button>

Importing with custom Sass variables
#

Most Bulma components are configured with Sass variables. For example, the .section layout component uses 4 variables to define its padding:

$section-padding: 3rem 1.5rem !default;
$section-padding-desktop: 3rem 3rem !default;
$section-padding-medium: 9rem 4.5rem !default;
$section-padding-large: 18rem 6rem !default;

The @use keyword allows use to configure a module when loading it with our own variables:

// Load the section component with custom variables
@use "bulma/sass/layout/section" with (
  $section-padding: 3rem,
  $section-padding-desktop: 4.5rem
);



Responsiveness

Bulma is a mobile-first framework
CSS Masterclass
Vertical by default
#

Every element in Bulma is mobile-first and optimizes for vertical reading, so by default on mobile:

    columns are stacked vertically
    the level component will show its children stacked vertically
    the nav menu will be hidden

You can however enforce the horizontal layout for both columns or level by appending the is-mobile modifier.
Breakpoints
#

Bulma has 4 breakpoints which defines 5 screen sizes:

    mobile: up to 768px
    tablet: from 769px
    desktop: from 1024px
    widescreen: from 1216px
    fullhd: from 1408px

To make use of these breakpoints, Bulma provides 9 responsive mixins.
Mobile
Up to 768px 	Tablet
Between 769px and 1023px 	Desktop
Between 1024px and 1215px 	Widescreen
Between 1216px and 1407px 	FullHD
1408px and above

mobile
	

-

-
	

tablet

-
	

desktop

-
	

widescreen

-
	

fullhd

-
	

tablet-only
	

-

-
	

desktop-only
	

-

-
	

widescreen-only
	

-

touch
	

-

until-widescreen
	

-

until-fullhd
	

-

To simplify using these breakpoints, Bulma provides easy-to-use responsive mixins.
Disabling breakpoints
#

By default, the $widescreen and $fullhd breakpoints are enabled. You can disable them by setting the corresponding Sass boolean to false:

// Disable the widescreen breakpoint
$widescreen-enabled: false;

// Disable the fullhd breakpoint
$fullhd-enabled: false;



CSS Variables in Bulma

Customizing with CSS only
CSS Masterclass

All Bulma components are styled using CSS Variables (which are also called CSS custom properties). Read more about them on the MDN Reference.

For example, here is how the .title element is styled:

.title {
  color: var(--bulma-title-color);
  font-size: var(--bulma-title-size);
  font-weight: var(--bulma-title-weight);
  line-height: var(--bulma-title-line-height);
}

Scope

Bulma CSS variables are either defined:

    at the global scope :root
    at the component scope, like .button

CSS Variables defined at a more specific scope (like .button) will override the ones defined at a more global scope.

:root {
  /* Default global value */
  --bulma-size-medium: 1.25rem;
}

.button {
  /* Overrides the global value */
  --bulma-size-medium: 1.5rem;
}

Prefix

All Bulma CSS variables are prefixed with bulma- (including the dash). You will notice theme when inspecting a webpage:

Inspect CSS variables

This prefix can be changed by setting the $cssvars-prefix Sass variable:

@use "bulma/sass" with (
  $cssvars-prefix: "my-prefix-"
);

Themes

The global CSS variables defined at the :root level are what defines a Bulma theme. Think of a theme as simply a collection of CSS variables.



Themes in Bulma

How Bulma styles its components with CSS variables
CSS Masterclass

In Bulma, a theme is a collection of CSS variables.

Bulma comes with 2 themes:

    light.scss (required)
    dark.scss (optional)

The default themes

Because Bulma requires a default value for all CSS variables, it comes with a default light theme located at /sass/themes/light.scss.

It also comes with a dark theme located at /sass/themes/dark.scss.

The file /sass/themes/_index.scss takes care of including both themes, each in two ways:

    with the @media (prefers-color-scheme: $name) media query
    with an HTML attribute [data-theme=$name] and CSS class .theme-$name selector

The only difference is that the light theme is also defined at the top-level: :root (equivalent to the html element, the ancestor of all HTML elements on a webpage). This ensures that a default value is set for all CSS variables.

The CSS output of that theme resembles the following:

:root {
    /* CSS Variables */
}

@media (prefers-color-scheme: light) {
  :root {
    /* CSS Variables */
  }
}

@media (prefers-color-scheme: dark) {
  :root {
    /* CSS Variables */
  }
}

[data-theme=light],
.theme-light {
  /* CSS Variables */
}

[data-theme=dark],
.theme-dark {
  /* CSS Variables */
}

Creating a custom theme

Creating a theme is essentially setting your own CSS variables. A custom theme requires:

    a name like sunrise
    a scope like :root, [data-theme=sunrise], .theme-sunrise or all three
    a set of CSS variables and their new value

Customizing in the browser

If you set your CSS variables under the :root scope, you are overwriting Bulma’s default theme. This can be done by with Sass or CSS.

To test out the CSS method, simply follow these steps:

Open your browser inspector
Step

Select the html element
Step

Insert a new value for the --bulma-link-h variable (the hue of the link color)
Step

Notice how the CSS Helpers section in the side menu changes color
Step



Dark Mode in Bulma

Bulma comes with an automatic Dark mode
CSS Masterclass

Modern browsers come with a way to detect if a user has set their theme preference to light or dark by using the prefers-color-scheme keyword.

This value can be used in a media query to change a website’s styles accordingly:

@media (prefers-color-scheme: dark) {
  :root {
    /* Update CSS variables */
  }
}

However, it’s not possible for a website to alter this preference. That’s why it’s preferable to also add a data-theme HTML attribute or a theme-dark CSS class.

This is how Bulma defines its dark theme:

@media (prefers-color-scheme: dark) {
  :root {
    /* Update CSS variables */
  }
}

[data-theme=dark],
.theme-dark {
  /* Update CSS variables */
}

With these rules:

    the website will be light by default, if no user preference is set
    it will also be light if the user has set their preference to light
    the website will be dark if the user has set their preference to dark

Force Dark Mode within a page
#

You can enable Dark Mode in part of your HTML by simply using the HTML attribute or the CSS class:

<div>
  This is in Light Mode if the user hasn't set a preference, or if their preference is set to <code>light</code>.
</div>

<div data-theme="dark">
  This is in Dark Mode
</div>

<div class="theme-dark">
  This is also in Dark Mode
</div>

Force Dark Mode for a whole webpage
#

If you want to enable Dark Mode for a whole webpage, simply set the attribute or the class on the <html> element:

<html data-theme="dark">
<!-- Or -->
<html class="theme-dark">

How the Dark theme is created
#

This is the content of the sass/themes/dark.scss file:

@use "sass/utilities/initial-variables" as iv;
@use "sass/utilities/css-variables" as cv;
@use "sass/utilities/derived-variables" as dv;
@use "sass/themes/setup";

// The main lightness of this theme
$scheme-main-l: 11%;
$background-l: 14%;
$text-l: 71%;

// The main scheme color, used to make calculations
$scheme-main: hsl(iv.$scheme-h, iv.$scheme-s, $scheme-main-l);
$background: hsl(iv.$scheme-h, iv.$scheme-s, $background-l);
$text: hsl(iv.$scheme-h, iv.$scheme-s, $text-l);

@mixin dark-theme {
  // Required: update the lightness colors and hover/active states
  @include cv.register-vars(
    (
      "scheme-brightness": "dark",
      "scheme-main-l": $scheme-main-l,
      "scheme-main-bis-l": $scheme-main-l + 2%,
      "scheme-main-ter-l": $scheme-main-l + 4%,
      "background-l": $background-l,
      "border-weak-l": 21%,
      "border-l": 24%,
      "text-weak-l": 53%,
      "text-l": $text-l,
      "text-strong-l": 93%,
      "text-title-l": 100%,
      "hover-background-l-delta": 5%,
      "active-background-l-delta": 10%,
      "hover-border-l-delta": 10%,
      "active-border-l-delta": 20%,
      "hover-color-l-delta": 5%,
      "active-color-l-delta": 10%,
    )
  );

  // Required: update the "on scheme" colors since the main scheme color is changed
  // from white (100% lightness)
  // to black (11% lightness in this case)
   @each $name, $color in dv.$colors {
    @include cv.generate-on-scheme-colors($name, $color, $scheme-main);
  }

  // Optional: update the shadow color
  @include cv.register-hsl("shadow", white);
}

This mixin outputs a list of CSS variables and their new value.

To use this theme with the prefer-color-scheme media query, write the following:

@use "sass/utilities/css-variables" as cv;
@use "sass/themes/dark";

@include cv.system-theme($name: "dark") {
  @include dark.dark-theme;
}

To use this theme with the [data-theme=dark] and .theme-dark selectors, write the following:

@use "sass/utilities/css-variables" as cv;
@use "sass/themes/dark";
@use "sass/themes/setup";

@include cv.bulma-theme($name: "dark") {
  @include dark.dark-theme;
  @include setup.setup-theme;
}

The bulma-theme() mixin

This mixin will allow you to generate a CSS rule-set with both an appropriate HTML attribute selector and a CSS class selector, which names are defined by the $name parameter.

@use "sass/utilities/css-variables" as cv;

@include cv.bulma-theme($name: "my-theme") {
  // Your code
}

This will output the following:

[data-theme=my-theme],
.theme-my-theme {
  /* Your code */
}

The system-theme() mixin

This mixin will generate a @media (prefers-color-scheme: $name) media query.

@use "sass/utilities/css-variables" as cv;

@include cv.system-theme($name: "dark") {
  // Your code
}

This will output the following:

@media (prefers-color-scheme: dark) {
  :root {
    /* Your code */
  }
}

The register-vars() function

All Bulma CSS variables are prefixed with bulma-. This prefix is defined with the $cssvars-prefix: "bulma-"; Sass variable.

Because writing all CSS variables with this prefix can be cumbersome, Bulma provides a Sass function to register new variables: register-vars().

This function accepts a Sass map of name: value pairs.

@use "sass/utilities/css-variables" as cv;

$scheme-main-l: 11%;
$background-l: 14%;
$text-l: 71%;

@include cv.bulma-theme($name: "my-theme") {
  @include cv.register-vars(
    (
      "scheme-brightness": "dark",
      "scheme-main-l": $scheme-main-l,
      "scheme-main-bis-l": $scheme-main-l + 2%,
      "scheme-main-ter-l": $scheme-main-l + 4%,
      "background-l": $background-l,
      "border-weak-l": 21%,
      "border-l": 24%,
      "text-weak-l": 53%,
      "text-l": $text-l,
      "text-strong-l": 93%,
      "text-title-l": 100%,
      "hover-background-l-delta": 5%,
      "active-background-l-delta": 10%,
      "hover-border-l-delta": 10%,
      "active-border-l-delta": 20%,
      "hover-color-l-delta": 5%,
      "active-color-l-delta": 10%,
    )
  );
}

Updating the lightness

For Dark Mode, Bulma will keep the same hue and saturation of the main scheme color. It will however invert the lightness of background, borders, text colors, and hover/active states.
Lightness Name 	Light Mode (default) 	Dark Mode (default)
--bulma-scheme-main-l 	100% 		11% 	
--bulma-scheme-main-bis-l 	98% 		13% 	
--bulma-scheme-main-ter-l 	98% 		15% 	
--bulma-background-l 	96% 		14% 	
--bulma-border-weak-l 	93% 		21% 	
--bulma-border-l 	86% 		24% 	
--bulma-text-weak-l 	48% 		53% 	
--bulma-text-l 	29% 		71% 	
--bulma-text-strong-l 	21% 		93% 	
--bulma-text-title-l 	14% 		100% 	
--bulma-hover-background-l-delta 	5% 	5%
--bulma-active-background-l-delta 	10% 	10%
--bulma-hover-border-l-delta 	10% 	10%
--bulma-active-border-l-delta 	20% 	20%
--bulma-hover-color-l-delta 	5% 	5%
--bulma-active-color-l-delta 	10% 	10%
The generate-on-scheme-colors() function

The scheme color is the one used for:

    backgrounds
    borders
    text shades
        strong text
        weak text
        title text
        and normal text

For each of the 7 primary colors , the default Bulma theme generates on scheme shades, meaning shades of each color that will look decent on the main scheme color.

In Light Mode, they look like this:
link 	var(--bulma-link-on-scheme)
primary 	var(--bulma-primary-on-scheme)
info 	var(--bulma-info-on-scheme)
success 	var(--bulma-success-on-scheme)
warning 	var(--bulma-warning-on-scheme)
danger 	var(--bulma-danger-on-scheme)

Because in Dark Mode we are inverting the lightness of these colors, the page background will go from white to black . We thus need to update the -on-scheme colors of all 7 primary colors.

In Dark Mode, they look like this:
link 	var(--bulma-link-on-scheme)
primary 	var(--bulma-primary-on-scheme)
info 	var(--bulma-info-on-scheme)
success 	var(--bulma-success-on-scheme)
warning 	var(--bulma-warning-on-scheme)
danger 	var(--bulma-danger-on-scheme)

If you are creating your own theme, you can automatically generate new -on-scheme colors by using the generate-on-scheme-colors() for each color. It takes 3 parameters:

    $name which is a string. E.g. "primary"
    $color which is the color value. E.g.
    $scheme-main which is the theme’s main scheme color (the one used as the page background). E.g. #fff

The full code looks like this:

@use "sass/utilities/css-variables" as cv;
@use "sass/utilities/derived-variables" as dv;

$scheme-main-l: 11%;
$scheme-main: hsl(iv.$scheme-h, iv.$scheme-s, $scheme-main-l);

@include cv.bulma-theme($name: "my-theme") {
  @each $name, $color in dv.$colors {
    @include cv.generate-on-scheme-colors($name, $color, $scheme-main);
  }
}

The setup-theme() function

In Bulma, some CSS variables reference other CSS variables. For example, --bulma-scheme-main is defined like this:

:root {
  --bulma-scheme-main: hsl(
    var(--bulma-scheme-h)
    var(--bulma-scheme-s)
    var(--bulma-scheme-main-l)
  );
}

Because of how CSS variables work, if you update the value of --bulma-scheme-main-l, you need to define --bulma-scheme-main again. That is what setup-theme() does.

[data-theme=my-theme],
.theme-my-theme {
  --bulma-scheme-main-l: 7%;
  --bulma-scheme-main: hsl(
    var(--bulma-scheme-h)
    var(--bulma-scheme-s)
    var(--bulma-scheme-main-l)
  );
}

If you create your own theme, simply call this function after having set your own CSS variables:

@use "sass/themes/setup";

@include cv.bulma-theme($name: "my-theme") {
  // Set your own CSS variables,
  // either manually:
  --bulma-scheme-main-l: 7%;
  // or using Bulma's register-vars() function:
  @include register-vars((
    "bulma-scheme-main-l": 7%,
  ));

  // Then, setup the new theme.
  @include setup.setup-theme();
}



Color Palettes in Bulma

Input 1 color, Receive dozens of different shades for that color
CSS Masterclass

Bulma comes with 7 primary colors:
text	
link	
primary	
info	
success	
warning	
danger	

Bulma will automatically generate a collection of CSS variables for each of those colors. These sets of variables act as a color palette you can use to play with different shades of a same color.

For example, by setting the primary color with $primary: hsl(171, 100%, 41%), Bulma will generate the following CSS variables:

    --bulma-primary
    --bulma-primary-rgb if you want to create your own RGBA shade: rgba(var(--bulma-primary-rgb), 0.5)
    --bulma-primary-h equal to the primary hue
    --bulma-primary-s equal to the primary saturation
    --bulma-primary-l equal to the primary lightness
    --bulma-primary-base (equal to --bulma-primary)
    --bulma-primary-invert which is a color that will look decent on the primary color (in a foreground/background combination)
    --bulma-primary-light which is the primary color at 90% lightness
    --bulma-primary-light-invert which is a color that looks good on the -light version
    --bulma-primary-dark which is the primary color at 20% lightness
    --bulma-primary-dark-invert which is a color that looks good on the -dark version
    --bulma-primary-soft which is a light color in light mode, and a dark color in dark mode
    --bulma-primary-bold which is a dark color in light mode, and a light color in dark mode
    --bulma-primary-soft-invert which is the same as the bold version
    --bulma-primary-bold-invert which is the same as the soft version
    --bulma-primary-on-scheme which is a color that looks good on the scheme-main color (which by default is white, and is used as the page’s background color)

Here is what they look like:
--bulma-primary 		The quick brown fox jumps over the lazy dog
--bulma-primary-invert 		The quick brown fox jumps over the lazy dog
--bulma-primary-light 		The quick brown fox jumps over the lazy dog
--bulma-primary-light-invert 		The quick brown fox jumps over the lazy dog
--bulma-primary-dark 		The quick brown fox jumps over the lazy dog
--bulma-primary-dark-invert 		The quick brown fox jumps over the lazy dog
--bulma-primary-soft 		The quick brown fox jumps over the lazy dog
--bulma-primary-bold 		The quick brown fox jumps over the lazy dog
--bulma-primary-on-scheme 		The quick brown fox jumps over the lazy dog
Soft and Bold colors

Because Bulma now has a Dark Mode, it comes with a new color concept: soft and bold colors.

A soft color is a shade of a color that has little contrast with the background. It’s a muted, faint shade of that color.

In light mode, this means that a soft color will be light as well. It’s ideal of backgrounds:
	--bulma-primary-soft as background 	The quick brown fox jumps over the lazy dog

On the other hand, the bold color has a stark contrast with the background. It’s a strong, distinct shade of that color.

In light mode, this means that a bold color will be dark. It’s ideal of text colors:
	--bulma-primary-bold as text color 	The quick brown fox jumps over the lazy dog

The best use of these colors is to combine them: the soft color as background, the bold color as foreground:
--bulma-primary-soft as background
--bulma-primary-bold as foreground 	The quick brown fox jumps over the lazy dog
Automatic switching when going into Dark Mode

If you use switch to between light mode and dark mode, you will notice that the soft and bold colors will swap. That way, you don’t need to update your CSS classes to keep a decent design.
System 	Light Mode 	Dark Mode
The quick brown fox jumps over the lazy dog 	The quick brown fox jumps over the lazy dog 	The quick brown fox jumps over the lazy dog
Invert colors

The purpose of -invert colors is to combine them with their base counterparts. For example, if you use primary-light as the background color, you can use primary-light-invert as the foreground color:
Background 	--bulma-primary 	bulma-primary-invert
on
bulma-primary
Foreground 	--bulma-primary-invert
Background 	--bulma-primary-light 	bulma-primary-light-invert
on
bulma-primary-light
Foreground 	--bulma-primary-light-invert
Background 	--bulma-primary-dark 	bulma-primary-dark-invert
on
bulma-primary-dark
Foreground 	--bulma-primary-dark-invert
21 shades for each color

Bulma will automatically generate 21 shades of each color, one for each amount of lightness, starting from around 0% and going up in 5% increments, until 100% is reached.

    I am saying around 0% because the last digit is determined by the base color. If the base color’s lightness is 42%, then --bulma-primary-00 will be 2%, not 0%.

--bulma-primary-00 		--bulma-primary-00-invert 	
--bulma-primary-05 		--bulma-primary-05-invert 	
--bulma-primary-10 		--bulma-primary-10-invert 	
--bulma-primary-15 		--bulma-primary-15-invert 	
--bulma-primary-20 		--bulma-primary-20-invert 	
--bulma-primary-25 		--bulma-primary-25-invert 	
--bulma-primary-30 		--bulma-primary-30-invert 	
--bulma-primary-35 		--bulma-primary-35-invert 	
--bulma-primary-40 		--bulma-primary-40-invert 	
--bulma-primary-45 		--bulma-primary-45-invert 	
--bulma-primary-50 		--bulma-primary-50-invert 	
--bulma-primary-55 		--bulma-primary-55-invert 	
--bulma-primary-60 		--bulma-primary-60-invert 	
--bulma-primary-65 		--bulma-primary-65-invert 	
--bulma-primary-70 		--bulma-primary-70-invert 	
--bulma-primary-75 		--bulma-primary-75-invert 	
--bulma-primary-80 		--bulma-primary-80-invert 	
--bulma-primary-85 		--bulma-primary-85-invert 	
--bulma-primary-90 		--bulma-primary-90-invert 	
--bulma-primary-95 		--bulma-primary-95-invert 	
--bulma-primary-100 		--bulma-primary-100-invert 	

Each of these shades has an -invert counterpart that can be used as a foreground color:
Background 	--bulma-primary-00 	bulma-primary-00-invert
on
bulma-primary-00
Foreground 	--bulma-primary-00-invert
Background 	--bulma-primary-05 	bulma-primary-05-invert
on
bulma-primary-05
Foreground 	--bulma-primary-05-invert
Background 	--bulma-primary-10 	bulma-primary-10-invert
on
bulma-primary-10
Foreground 	--bulma-primary-10-invert
Background 	--bulma-primary-15 	bulma-primary-15-invert
on
bulma-primary-15
Foreground 	--bulma-primary-15-invert
Background 	--bulma-primary-20 	bulma-primary-20-invert
on
bulma-primary-20
Foreground 	--bulma-primary-20-invert
Background 	--bulma-primary-25 	bulma-primary-25-invert
on
bulma-primary-25
Foreground 	--bulma-primary-25-invert
Background 	--bulma-primary-30 	bulma-primary-30-invert
on
bulma-primary-30
Foreground 	--bulma-primary-30-invert
Background 	--bulma-primary-35 	bulma-primary-35-invert
on
bulma-primary-35
Foreground 	--bulma-primary-35-invert
Background 	--bulma-primary-40 	bulma-primary-40-invert
on
bulma-primary-40
Foreground 	--bulma-primary-40-invert
Background 	--bulma-primary-45 	bulma-primary-45-invert
on
bulma-primary-45
Foreground 	--bulma-primary-45-invert
Background 	--bulma-primary-50 	bulma-primary-50-invert
on
bulma-primary-50
Foreground 	--bulma-primary-50-invert
Background 	--bulma-primary-55 	bulma-primary-55-invert
on
bulma-primary-55
Foreground 	--bulma-primary-55-invert
Background 	--bulma-primary-60 	bulma-primary-60-invert
on
bulma-primary-60
Foreground 	--bulma-primary-60-invert
Background 	--bulma-primary-65 	bulma-primary-65-invert
on
bulma-primary-65
Foreground 	--bulma-primary-65-invert
Background 	--bulma-primary-70 	bulma-primary-70-invert
on
bulma-primary-70
Foreground 	--bulma-primary-70-invert
Background 	--bulma-primary-75 	bulma-primary-75-invert
on
bulma-primary-75
Foreground 	--bulma-primary-75-invert
Background 	--bulma-primary-80 	bulma-primary-80-invert
on
bulma-primary-80
Foreground 	--bulma-primary-80-invert
Background 	--bulma-primary-85 	bulma-primary-85-invert
on
bulma-primary-85
Foreground 	--bulma-primary-85-invert
Background 	--bulma-primary-90 	bulma-primary-90-invert
on
bulma-primary-90
Foreground 	--bulma-primary-90-invert
Background 	--bulma-primary-95 	bulma-primary-95-invert
on
bulma-primary-95
Foreground 	--bulma-primary-95-invert
Background 	--bulma-primary-100 	bulma-primary-100-invert
on
bulma-primary-100
Foreground 	--bulma-primary-100-invert
Lightness CSS variables

If you write your own CSS and want to use one these shades yourself, you can access the lightness value via its dedicated CSS variable that has a -l suffix.

For example, the bulma-primary-75 color is defined like this:

:root {
  --bulma-primary-75: hsla(
    var(--bulma-primary-h),
    var(--bulma-primary-s),
    var(--bulma-primary-75-l),
    1
  );
}

In this case, --bulma-primary-75-l is equal to 76%, and you can access its value with the var(--bulma-primary-75-l) CSS variable.
CSS helper classes

While you can access all a color’s CSS variables directly by writing color: var(--bulma-primary) for example, Bulma also provides CSS helper classes for each color.

Those helper classes exist for to set either the color or the background.
# 	Color 	color class 	background class
	--bulma-primary 	has-text-primary 	Hello World 	has-background-primary 	Hello World

<span class="has-text-primary">Color</span>
<span class="has-background-primary">Background</span>

	--bulma-primary-invert 	has-text-primary-invert 	Hello World 	has-background-primary-invert 	Hello World

<span class="has-text-primary-invert">Color</span>
<span class="has-background-primary-invert">Background</span>

	--bulma-primary-light 	has-text-primary-light 	Hello World 	has-background-primary-light 	Hello World

<span class="has-text-primary-light">Color</span>
<span class="has-background-primary-light">Background</span>

	--bulma-primary-light-invert 	has-text-primary-light-invert 	Hello World 	has-background-primary-light-invert 	Hello World

<span class="has-text-primary-light-invert">Color</span>
<span class="has-background-primary-light-invert">Background</span>

	--bulma-primary-dark 	has-text-primary-dark 	Hello World 	has-background-primary-dark 	Hello World

<span class="has-text-primary-dark">Color</span>
<span class="has-background-primary-dark">Background</span>

	--bulma-primary-dark-invert 	has-text-primary-dark-invert 	Hello World 	has-background-primary-dark-invert 	Hello World

<span class="has-text-primary-dark-invert">Color</span>
<span class="has-background-primary-dark-invert">Background</span>

	--bulma-primary-on-scheme 	has-text-primary-on-scheme 	Hello World 	has-background-primary-on-scheme 	Hello World

<span class="has-text-primary-on-scheme">Color</span>
<span class="has-background-primary-on-scheme">Background</span>

	--bulma-primary-00 	has-text-primary-00 	Hello World 	has-background-primary-00 	Hello World

<span class="has-text-primary-00">Color</span>
<span class="has-background-primary-00">Background</span>

	--bulma-primary-05 	has-text-primary-05 	Hello World 	has-background-primary-05 	Hello World

<span class="has-text-primary-05">Color</span>
<span class="has-background-primary-05">Background</span>

	--bulma-primary-10 	has-text-primary-10 	Hello World 	has-background-primary-10 	Hello World

<span class="has-text-primary-10">Color</span>
<span class="has-background-primary-10">Background</span>

	--bulma-primary-15 	has-text-primary-15 	Hello World 	has-background-primary-15 	Hello World

<span class="has-text-primary-15">Color</span>
<span class="has-background-primary-15">Background</span>

	--bulma-primary-20 	has-text-primary-20 	Hello World 	has-background-primary-20 	Hello World

<span class="has-text-primary-20">Color</span>
<span class="has-background-primary-20">Background</span>

	--bulma-primary-25 	has-text-primary-25 	Hello World 	has-background-primary-25 	Hello World

<span class="has-text-primary-25">Color</span>
<span class="has-background-primary-25">Background</span>

	--bulma-primary-30 	has-text-primary-30 	Hello World 	has-background-primary-30 	Hello World

<span class="has-text-primary-30">Color</span>
<span class="has-background-primary-30">Background</span>

	--bulma-primary-35 	has-text-primary-35 	Hello World 	has-background-primary-35 	Hello World

<span class="has-text-primary-35">Color</span>
<span class="has-background-primary-35">Background</span>

	--bulma-primary-40 	has-text-primary-40 	Hello World 	has-background-primary-40 	Hello World

<span class="has-text-primary-40">Color</span>
<span class="has-background-primary-40">Background</span>

	--bulma-primary-45 	has-text-primary-45 	Hello World 	has-background-primary-45 	Hello World

<span class="has-text-primary-45">Color</span>
<span class="has-background-primary-45">Background</span>

	--bulma-primary-50 	has-text-primary-50 	Hello World 	has-background-primary-50 	Hello World

<span class="has-text-primary-50">Color</span>
<span class="has-background-primary-50">Background</span>

	--bulma-primary-55 	has-text-primary-55 	Hello World 	has-background-primary-55 	Hello World

<span class="has-text-primary-55">Color</span>
<span class="has-background-primary-55">Background</span>

	--bulma-primary-60 	has-text-primary-60 	Hello World 	has-background-primary-60 	Hello World

<span class="has-text-primary-60">Color</span>
<span class="has-background-primary-60">Background</span>

	--bulma-primary-65 	has-text-primary-65 	Hello World 	has-background-primary-65 	Hello World

<span class="has-text-primary-65">Color</span>
<span class="has-background-primary-65">Background</span>

	--bulma-primary-70 	has-text-primary-70 	Hello World 	has-background-primary-70 	Hello World

<span class="has-text-primary-70">Color</span>
<span class="has-background-primary-70">Background</span>

	--bulma-primary-75 	has-text-primary-75 	Hello World 	has-background-primary-75 	Hello World

<span class="has-text-primary-75">Color</span>
<span class="has-background-primary-75">Background</span>

	--bulma-primary-80 	has-text-primary-80 	Hello World 	has-background-primary-80 	Hello World

<span class="has-text-primary-80">Color</span>
<span class="has-background-primary-80">Background</span>

	--bulma-primary-85 	has-text-primary-85 	Hello World 	has-background-primary-85 	Hello World

<span class="has-text-primary-85">Color</span>
<span class="has-background-primary-85">Background</span>

	--bulma-primary-90 	has-text-primary-90 	Hello World 	has-background-primary-90 	Hello World

<span class="has-text-primary-90">Color</span>
<span class="has-background-primary-90">Background</span>

	--bulma-primary-95 	has-text-primary-95 	Hello World 	has-background-primary-95 	Hello World

<span class="has-text-primary-95">Color</span>
<span class="has-background-primary-95">Background</span>

	--bulma-primary-100 	has-text-primary-100 	Hello World 	has-background-primary-100 	Hello World

<span class="has-text-primary-100">Color</span>
<span class="has-background-primary-100">Background</span>




Skeletons in Bulma

Transform almost any Bulma component into a skeleton loader, or use one of the pre-built utility elements
CSS Masterclass

A skeleton loader is a loading state that acts as a placeholder for content in an interface. Bulma v1 ships with 2 skeleton elements, and skeleton variants for most Bulma components.

All skeleton loaders share these CSS variables:

:root {
  --bulma-skeleton-background: var(--bulma-border);
  --bulma-skeleton-radius: var(--bulma-radius-small);
  --bulma-skeleton-block-min-height: 4.5em;
  --bulma-skeleton-lines-gap: 0.75em;
  --bulma-skeleton-line-height: 0.75em;
}

Skeleton Block
#

The skeleton block is a simple block element with a pulsating background. It has a minimum height of 4.5em.

Example

HTML

<div class="skeleton-block"></div>

If you insert text inside this block, you can make its height responsive:

Example
Vivamus sagittis lacus vel augue laoreet rutrum faucibus dolor auctor. Fusce dapibus, tellus ac cursus commodo, tortor mauris condimentum nibh, ut fermentum massa justo sit amet risus. Donec sed odio dui. Nullam quis risus eget urna mollis ornare vel eu leo. Cum sociis natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus. Nullam id dolor id nibh ultricies vehicula ut id elit.

HTML

<div class="skeleton-block">
  Vivamus sagittis lacus vel augue laoreet rutrum faucibus dolor auctor.
  Fusce dapibus, tellus ac cursus commodo, tortor mauris condimentum nibh,
  ut fermentum massa justo sit amet risus. Donec sed odio dui.
  Nullam quis risus eget urna mollis ornare vel eu leo.
  Cum sociis natoque penatibus et magnis dis parturient montes,
  nascetur ridiculus mus. Nullam id dolor id
  nibh ultricies vehicula ut id elit.
</div>

Skeleton Lines
#

The skeleton lines element is a loading element which resembles a paragraph. Each <div></div> will render as a separate loading line.

Example

HTML

<div class="skeleton-lines">
  <div></div>
  <div></div>
  <div></div>
  <div></div>
  <div></div>
</div>

Bulma components with skeletons
#

Most Bulma elements and components have a skeleton variant, which can be enabled by adding either the is-skeleton or has-skeleton modifier.
Button
#

Example

HTML

<div class="buttons">
  <button class="button is-skeleton">Button</button>
  <button class="button is-link is-skeleton">Link</button>
  <button class="button is-primary is-skeleton">Primary</button>
  <button class="button is-success is-skeleton">Success</button>
  <button class="button is-info is-skeleton">Info</button>
  <button class="button is-warning is-skeleton">Warning</button>
  <button class="button is-danger is-skeleton">Danger</button>
</div>

Icon
#

Example

HTML

<span class="icon is-skeleton">
  <i class="fas fa-reply"></i>
</span>

Image
#

Example
Placeholder
Placeholder
Placeholder
Placeholder

HTML

<figure class="image is-16x16 is-skeleton">
  <img alt="Placeholder" src="https://placehold.co/16x16">
</figure>

<figure class="image is-32x32 is-skeleton">
  <img alt="Placeholder" src="https://placehold.co/32x32">
</figure>

<figure class="image is-64x64 is-skeleton">
  <img alt="Placeholder" src="https://placehold.co/64x64">
</figure>

<figure class="image is-128x128 is-skeleton">
  <img alt="Placeholder" src="https://placehold.co/128x128">
</figure>

Media Object
#

Example

Placeholder image

John Smith @johnsmith 31m
Lorem ipsum dolor sit amet, consectetur adipiscing elit. Proin ornare magna eros, eu pellentesque tortor sociis natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus est non commodo luctus, nisi erat porttitor ligula, eget lacinia odio sem nec elit vestibulum ut. Maecenas non massa sem. Etiam finibus odio quis feugiat facilisis.

HTML

<article class="media">
  <figure class="media-left">
    <p class="image is-64x64 is-skeleton">
      <img src="https://placehold.co/128x128" alt="Placeholder image">
    </p>
  </figure>
  <div class="media-content">
    <div class="content is-skeleton">
      <p>
        <strong>John Smith</strong> <small>@johnsmith</small> <small>31m</small>
        <br>
        Lorem ipsum dolor sit amet, consectetur adipiscing elit. Proin ornare magna eros, eu pellentesque tortor
        sociis natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus est non commodo luctus,
        nisi erat porttitor ligula, eget lacinia odio sem nec elit
        vestibulum ut. Maecenas non massa sem. Etiam finibus odio quis feugiat facilisis.
      </p>
    </div>
    <nav class="level is-mobile">
      <div class="level-left">
        <a class="level-item"><span class="icon is-small is-skeleton"><i class="fas fa-reply"></i></span></a>
        <a class="level-item"><span class="icon is-small is-skeleton"><i class="fas fa-retweet"></i></span></a>
        <a class="level-item"><span class="icon is-small is-skeleton"><i class="fas fa-heart"></i></span></a>
      </div>
    </nav>
  </div>
  <div class="media-right">
    <button aria-label="delete" class="delete is-skeleton"></button>
  </div>
</article>

Example

Placeholder image

Press enter to submit

HTML

<article class="media">
  <figure class="media-left">
    <p class="image is-64x64 is-skeleton">
      <img src="https://placehold.co/128x128" alt="Placeholder image">
    </p>
  </figure>
  <div class="media-content">
    <div class="field">
      <p class="control">
        <textarea class="textarea is-skeleton" placeholder="Add a comment..."></textarea>
      </p>
    </div>
    <nav class="level">
      <div class="level-left">
        <div class="level-item">
          <a class="button is-info is-skeleton">Submit</a>
        </div>
      </div>
      <div class="level-right">
        <div class="level-item">
          <label class="checkbox is-skeleton"> <input type="checkbox"> Press enter to submit </label>
        </div>
      </div>
    </nav>
  </div>
</article>

Notification
#

Example
Curabitur blandit tempus porttitor. Etiam porta sem malesuada magna mollis euismod. Cras justo odio, dapibus ac facilisis in, egestas eget quam.

HTML

<div class="notification is-skeleton">
  Curabitur blandit tempus porttitor. Etiam porta sem malesuada magna mollis euismod. Cras justo odio, dapibus ac facilisis in, egestas eget quam.
</div>

Tag
#

Example
Tag Link Primary Info Success Warning Danger

HTML

<span class="tag is-skeleton">Tag</span>
<span class="tag is-link is-skeleton">Link</span>
<span class="tag is-primary is-skeleton">Primary</span>
<span class="tag is-info is-skeleton">Info</span>
<span class="tag is-success is-skeleton">Success</span>
<span class="tag is-warning is-skeleton">Warning</span>
<span class="tag is-danger is-skeleton">Danger</span>

Title and Subtitle
#
The `.title` and `.subtitle` elements have both an `is-skeleton` and `has-skeleton` variant: * `is-skeleton` will turn the whole block into a loading skeleton * `has-skeleton` will turn only a small part of its content into a loading skeleton, to simulate loading only the inner text rather than the whole block

Example
Title

HTML

<h1 class="title is-skeleton">
  Title
</h1>

Example
Title

HTML

<h1 class="title has-skeleton">
  Title
</h1>

Example
Subtitle

HTML

<h2 class="subtitle is-skeleton">
  Subtitle
</h2>

Example
Subtitle

HTML

<h2 class="subtitle has-skeleton">
  Subtitle
</h2>

Example
Title
Subtitle

HTML

<h1 class="title is-skeleton">
  Title
</h1>
<h2 class="subtitle is-skeleton">
  Subtitle
</h2>

Example
Title
Subtitle

HTML

<h1 class="title has-skeleton">
  Title
</h1>
<h2 class="subtitle has-skeleton">
  Subtitle
</h2>

Form Controls
#

Example

HTML

<input class="input is-skeleton">

Example

HTML

<textarea class="textarea is-skeleton"></textarea>




Bulma Sass Mixins

Utility mixins for custom elements and other CSS helpers
CSS Masterclass

Throughout the codebase, Bulma uses Sass mixins to enhance and facilitate the CSS output. While these mixins are mainly used within the context of Bulma, they are of course available for you to re-use in your own projects.
Element Mixins
#

These mixins create a visual HTML element.
Arrow
#

The arrow() mixin creates a down-facing arrow. The $color parameter defines the color of the arrow.

.bulma-arrow-mixin {
  @include mixins.arrow(purple);
}

Example

HTML

<span class="bulma-arrow-mixin"></span>

Burger
#

The burger() mixin creates a 16x16px set of 3 horizontal bars grouped within square. The dimensions of this square are defined by the $dimensions parameter.

.bulma-burger-mixin {
  @include mixins.burger(2.5rem);
}

Example

HTML

<button class="bulma-burger-mixin">
  <span></span>
  <span></span>
  <span></span>
  <span></span>
</button>

Delete
#

The delete() mixin creates a 20x20px circle containing a cross. It comes with 3 modifiers: is-small, is-medium and is-large.

.bulma-delete-mixin {
  @include mixins.delete;
}

Example

HTML

<button class="bulma-delete-mixin is-small"></button>
<button class="bulma-delete-mixin"></button>
<button class="bulma-delete-mixin is-medium"></button>
<button class="bulma-delete-mixin is-large"></button>

Loader
#

The loader() mixin creates a 1em spinning circle.

.bulma-loader-mixin {
  @include mixins.loader;
}

Example

HTML

<span class="bulma-loader-mixin"></span>

Font Awesome container
#

The fa() mixin creates a square inline-block element, ideal for containing a Font Awesome icon, or any other type of icon font.
The first $size parameter defines the icon font size.
The second $dimensions parameter defines the dimensions of the square container.

.bulma-fa-mixin {
  @include mixins.fa(1rem, 2rem);
  background-color: lavender; // For demo purposes
}

Example

HTML

<span class="bulma-fa-mixin">
  <i class="fas fa-thumbs-up"></i>
</span>

CSS Mixins
#

These mixins add CSS rules to the element.
Block
#

The block() mixin adds spacing below an element, but only if it's not the last child.
The $spacing parameter defines the value of the margin-bottom.

.bulma-block-mixin {
  @include mixins.block(1rem);
}

Example

This element has a margin-bottom.

This element too.

Not this one because it's the last child.

HTML

<p class="bulma-block-mixin">This element has a margin-bottom.</p>
<p class="bulma-block-mixin">This element too.</p>
<p class="bulma-block-mixin">Not this one because it's the last child.</p>

Overlay
#

The overlay() mixin makes the element cover its closest positioned ancestor.
The $offset parameter defines how far inside the element is positioned from each edge (top, bottom, left and right).

.bulma-overlay-mixin {
  @include mixins.overlay(1.5rem);
  background-color: darkorange;
  border-radius: 0.25em;
  color: white;
  opacity: 0.9;
  padding: 1em;
}

Example
Overlay element

HTML

<div class="bulma-overlay-mixin-parent">
  <div class="bulma-overlay-mixin">Overlay element</div>
</div>

Center
#

The center() mixin allows you to absolutely position an element with fixed dimensions at the center of its closest positioned ancestor.
The value of the $width parameter should be the width of the element the mixin is applied on.
Unless the element has square dimensions, the second parameter $height is required and its value should be the height of the element the mixin is applied on.

.bulma-center-mixin {
  @include mixins.center;
}

Example

HTML

<div class="bulma-center-mixin-parent">
  <img class="bulma-center-mixin" height="96" width="96" src="/assets/images/unsplash/mEZ3PoFGs_k.jpg">
</div>

Placeholder
#

The placeholder() mixin allows you to change the style of an input's placeholder.
The $offset parameter defines how far inside the element is positioned from each edge (top, bottom, left and right).

.bulma-placeholder-mixin {
  @include mixins.placeholder {
    color: lightblue;
  }
}

Example

HTML

<input
  class="input bulma-placeholder-mixin"
  type="text"
  placeholder="I am a styled placeholder"
>

Clearfix
#

The clearfix() mixin adds a ::after pseudo-element with a clear: both rule.

.bulma-clearfix-mixin {
  @include mixins.clearfix;
}

Example

This is a short image description.

This text is following the clearfix element and is correctly placed after.

HTML

<div class="bulma-clearfix-mixin">
  <img height="80" width="80" style="float: left;" src="/assets/images/unsplash/La2kOu2dmH4.jpg">
  <p>This is a short image description.</p>
</div>

<p>This text is following the clearfix element and is correctly placed after.</p>

Reset
#

The reset() mixin applies a soft style reset. This is especially useful for <button> elements.

.bulma-reset-mixin {
  @include mixins.reset;
}

Example

HTML

<button>Default button</button>
<button class="bulma-reset-mixin">Reset button</button>

Unselectable
#

The unselectable() mixin makes an element not selectable. This is to prevent the text to be selected when double-clicked.

.bulma-unselectable-mixin {
  @include mixins.unselectable;
}

Example

This text is selectable.

HTML

<p>This text is selectable.</p>
<p class="bulma-unselectable-mixin">This text is not selectable.</p>

Overflow Touch
#

The overflow-touch() mixin add the -webkit-overflow-scrolling: touch; rule to the element.
Direction Mixins
#
Left-to-right and Right-to-left Mixins
#

Bulma has a global $rtl flag, which allows the framework to output a Right-to-left version of the CSS. By default, this flag's value is set to false. This means the framework output a Left-to-right version.

The mixins @mixin ltr and @mixin rtl are here to output CSS rules based on the value of $rtl:

    if $rtl: true, @include mixins.ltr outputs nothing
    if $rtl: false, @include mixins.rtl outputs nothing

This is useful for properties that are specific to the side of an element.

.bulma-ltr-rtl-mixin {
  background-color: lightgreen;
  padding: 0.5em 1em;
  border: 1px solid seagreen;
  margin-right: -1px;

  &:first-child {
    @include mixins.ltr {
      border-bottom-left-radius: 0.5em;
      border-top-left-radius: 0.5em;
    }

    @include mixins.rtl {
      border-bottom-right-radius: 0.5em;
      border-top-right-radius: 0.5em;
    }
  }

  &:last-child {
    @include mixins.ltr {
      border-bottom-right-radius: 0.5em;
      border-top-right-radius: 0.5em;
    }

    @include mixins.rtl {
      border-bottom-left-radius: 0.5em;
      border-top-left-radius: 0.5em;
    }
  }
}

Example
One Two Three

HTML

<div style="display: flex;">
  <span class="bulma-ltr-rtl-mixin">One</span>
  <span class="bulma-ltr-rtl-mixin">Two</span>
  <span class="bulma-ltr-rtl-mixin">Three</span>
</div>

LTR Position
#

The ltr-position() mixin is a quick way to switch between left and right CSS properties when dealing with positioned elements.
The first $spacing parameter defines the value of the offset, whether it's right or left.
The second $right parameter defines if the property outputs right (default) or left.

Here is what the output looks like with a $spacing parameter set to 1rem:
Flag → 	$rtl: false; 	$rtl: true;
@include mixins.ltr-position(1rem, true) 	right: 1rem 	left: 1rem
@include mixins.ltr-position(1rem, false) 	left: 1rem 	right: 1rem

Sass source

.bulma-ltr-position-mixin {
  @include mixins.ltr-position(1rem, false);
  border-radius: 0.25em;
  position: absolute;
  top: 1rem;
}

CSS output

.bulma-ltr-position-mixin {
  left: 1rem;
  border-radius: 0.25em;
  position: absolute;
  top: 1rem;
}

Example

Cras mattis consectetur purus sit amet fermentum. Nulla vitae elit libero, a pharetra augue. Aenean lacinia bibendum nulla sed consectetur. Fusce dapibus, tellus ac cursus commodo, tortor mauris condimentum nibh, ut fermentum massa justo sit amet risus. Curabitur blandit tempus porttitor. Maecenas faucibus mollis interdum.

HTML

<div class="bulma-ltr-position-mixin-parent">
  <img class="bulma-ltr-position-mixin" height="48" width="48" src="/assets/images/unsplash/iFgRcqHznqg.jpg">
  <p>Cras mattis consectetur purus sit amet fermentum. Nulla vitae elit libero, a pharetra augue. Aenean lacinia bibendum nulla sed consectetur. Fusce dapibus, tellus ac cursus commodo, tortor mauris condimentum nibh, ut fermentum massa justo sit amet risus. Curabitur blandit tempus porttitor. Maecenas faucibus mollis interdum.</p>
</div>

LTR Property
#

The ltr-property() mixin works like the ltr-position() mixin but allows you to choose which CSS property to set. The mixin will append -right or -left to that property. This is especially useful for margin and padding.
The first $property parameter which property you want to "flip" left and right.
The second $spacing parameter defines the value of the offset, whether it's right or left.
The third $right parameter defines if the property outputs right (default) or left.

Here is what the output looks like with a $spacing parameter set to 1rem:
Flag → 	$rtl: false; 	$rtl: true;
@include mixins.ltr-property("margin", 1rem, true) 	margin-right: 1rem 	margin-left: 1rem
@include mixins.ltr-property("margin", 1rem, false) 	margin-left: 1rem 	margin-right: 1rem

Sass source

.bulma-ltr-property-mixin {
  @include mixins.ltr-property("margin", 1rem, false);
  border-radius: 0.25em;
}

CSS output

.bulma-ltr-property-mixin {
  margin-left: 1rem;
  border-radius: 0.25em;
}

Example

Cras mattis consectetur purus sit amet fermentum. Nulla vitae elit libero, a pharetra augue. Aenean lacinia bibendum nulla sed consectetur. Fusce dapibus, tellus ac cursus commodo, tortor mauris condimentum nibh, ut fermentum massa justo sit amet risus. Curabitur blandit tempus porttitor. Maecenas faucibus mollis interdum.

HTML

<div class="bulma-ltr-property-mixin-parent">
  <p>Cras mattis consectetur purus sit amet fermentum. Nulla vitae elit libero, a pharetra augue. Aenean lacinia bibendum nulla sed consectetur. Fusce dapibus, tellus ac cursus commodo, tortor mauris condimentum nibh, ut fermentum massa justo sit amet risus. Curabitur blandit tempus porttitor. Maecenas faucibus mollis interdum.</p>
  <img class="bulma-ltr-property-mixin" height="96" width="96" src="/assets/images/unsplash/jTSf1xnsoCs.jpg">


Bulma Sass Responsive Mixins

Mixins that allows you to define different styles for each screen size
CSS Masterclass

Bulma is responsive by default. Learn more about Bulma's responsiveness.
from() and until() mixins
#

Responsiveness in CSS is based on media queries (see MDN documentation).

Bulma provides 2 useful responsive mixins:

    @mixin from($breakpoint)

    to target devices with a screen wider than or equal to the breakpoint

    @mixin until($breakpoint)

    to target devices with a screen narrower than the breakpoint

Their usage is very simple:
from()
#

The from() mixin has a single parameter which sets the screen width from which the styles it contains will be applied:

Sass source

@use "bulma/sass/utilities/mixins";

.my-element {
  background: red;

  @include mixins.from(1280px) {
    background: blue;
  }
}

CSS output

.my-element {
  background: red;
}

@media screen and (min-width: 1280px) {
  .my-element {
    background: blue;
  }
}

For screens with a width of 1279px or less, the element's background will be red.
For screens 1280px-wide or more, the element's background will be blue.
until()
#

The until() mixin has a single parameter which sets the screen width (minus 1px) until which the styles it contains will be applied.

This means that if you set a value of 1280px, the styles will be applied on a screen width of 1279px but not on a screen width of 1280px.

The reason for this 1px offset is to allow you to use both from() and until() with the same breakpoint value. This leaves no gap between the 2 sets of rules.

Sass source

@use "bulma/sass/utilities/mixins";

$breakpoint: 1280px;

.my-element {
  @include mixins.until($breakpoint) {
    background: green;
  }

  @include mixins.from($breakpoint) {
    background: orange;
  }
}

CSS output

@media screen and (max-width: 1279px) {
  .my-element {
    background: green;
  }
}

@media screen and (min-width: 1280px) {
  .my-element {
    background: orange;
  }
}

For screens with a width of 1279px or less, the element's background will be green.
For screens 1280px-wide or more, the element's background will be orange.
Named mixins
#

By having 4 breakpoints and supporting 5 screen sizes, Bulma can support a lot of different setups.
While you could use the mixins

@include mixins.from()

and

@include mixins.until()

, Bulma provides quick shortcuts with 11 named mixins.

These responsive mixins are named after the screen sizes and breakpoints used in Bulma, so that you can use them to create a responsive designs:
Mobile
Up to 768px 	Tablet
Between 769px and 1023px 	Desktop
Between 1024px and 1215px 	Widescreen
Between 1216px and 1407px 	FullHD
1408px and above

@use "bulma/sass/utilities/mixins";

@include mixins.mobile {
  // Styles applied
  // below $tablet
}

-

-
	

@use "bulma/sass/utilities/mixins";

@include mixins.tablet {
  // Styles applied
  // above $tablet
}

-
	

@use "bulma/sass/utilities/mixins";

@include mixins.desktop {
  // Styles applied
  // above $desktop
}

-
	

@use "bulma/sass/utilities/mixins";

@include mixins.widescreen {
  // Styles applied
  // above $widescreen
}

-
	

@use "bulma/sass/utilities/mixins";

@include mixins.fullhd {
  // Styles applied
  // above $fullhd
}

-
	

@use "bulma/sass/utilities/mixins";

@include mixins.tablet-only {
  // Styles applied
  // between $tablet
  // and $desktop
}

-

-
	

@use "bulma/sass/utilities/mixins";

@include mixins.desktop-only {
  // Styles applied
  // between $desktop
  // and $widescreen
}

-

-
	

@use "bulma/sass/utilities/mixins";

@include mixins.widescreen-only {
  // Styles applied
  // between $widescreen
  // and $fullhd
}

-

@use "bulma/sass/utilities/mixins";

@include mixins.touch {
  // Styles applied
  // below $desktop
}

-

@use "bulma/sass/utilities/mixins";

@include mixins.until-widescreen {
  // Styles applied
  // below $widescreen
}

-

@use "bulma/sass/utilities/mixins";

@include mixins.until {
  // Styles applied
  // below $fullhd
}

-

Learn more about Bulma responsiveness.




Bulma Sass Form Control Mixins

Mixins for Bulma’s buttons and form controls
CSS Masterclass

In Bulma, the form controls are an essential part of the framework. They comprise the following elements:

    .button
    .input
    .select
    .file-cta .file-name
    .pagination-previous .pagination-next .pagination-link .pagination-ellipsis

The control() mixin ensures consistency by providing a set of styles that are shared between all these form controls. You can use it to create additional controls:

@use "bulma/sass/utilities/controls";

.bulma-control-mixin {
  @include controls.control;
  background: deeppink;
  color: white;
}

Example

HTML

<button class="bulma-control-mixin">
  My control
</button>

Sizes
#

Controls have a default font size of $size-normal and also come in 3 additional sizes, which can be accessed via 3 additional mixins:

    @include controls.control-small;

    with a font size $size-small

    @include controls.control-medium;

    with a font size $size-medium

    @include controls.control-large;

    with a font size $size-large

.bulma-control-mixin {
  &.is-small {
    @include controls.control-small;
  }

  &.is-medium {
    @include controls.control-medium;
  }

  &.is-large {
    @include controls.control-large;
  }
}

Example

HTML

<button class="bulma-control-mixin is-small">
  Small
</button>
<button class="bulma-control-mixin">
  Normal
</button>
<button class="bulma-control-mixin is-medium">
  Medium
</button>
<button class="bulma-control-mixin is-large">
  Large
</button>

Control placeholder
#

The control() mixin also exists as Sass placeholder %control

@use "bulma/sass/utilities/extends";

.bulma-control-extend {
  @extend %control;
  background: mediumblue;
  color: white;
}

Example

HTML

<button class="bulma-control-extend">
  My control
</button>



Bulma Sass Extends

Sass extends to keep your CSS code DRY
CSS Masterclass

In Bulma, a lot of element share a set of styles. While mixins allow sharing, they repeat the CSS rules everytime they are used.

To avoid the repetition, Bulma uses the @extend rule to share code. This rule tells Sass that one selector should inherit the styles of another. Learn more about the extend rule.

Instead of creating CSS classes that might not be used to be the source of the set of styles, Bulma uses Sass placeholders:

    %control

    %unselectable

    %arrow

    %block

    %delete

    %loader

    %overlay

    %reset

Each of these placeholders are simply the @extend version of their corresponding mixins (here for the control mixin).
How to use Bulma extends
#
Import the extend rules with @use and use them with @extend:

@use "bulma/sass/utilities/extends";

.my-control {
  @extend %control;
  background-color: purple;
  color: white;
}



Bulma Customization Concepts

What makes Bulma customizable
CSS Masterclass

Bulma is a highly customizable CSS framework. From colors to typography, spacing and sizes, forms and layouts, all parts of Bulma can be customized by the user.

Bulma’s styles and variables are defined at several levels:

    Global Sass variables
    Component Sass variables
    Global CSS variables
    Component CSS variables
    Helper classes

All Bulma components are styled using Sass variables and CSS Variables (which are also called CSS custom properties). Read more about them:

    on the Sass website
    on the MDN Reference

Global Sass Variables
#

Bulma uses Sass variables globally defined in 2 files located in the utilities folder:

    initial-variables.scss where you define variables by literal value
        colors like $blue: hsl(229, 53%, 53%)
        font sizes like $size-1: 3rem
        dimensions like $block-spacing: 1.5rem
        breakpoints like $tablet: 769px
        other values like $easing: ease-out or $radius-large: 0.75rem
    derived-variables.scss where variables are calculated from the values set in the previous file
        primary colors:
            $primary
            $link
            $success
            $info
            $warning
            $dark
        utility colors:
            $background
            $border
            $code and $pre
            $shadow-color
        typography:
            $family-primary
            $family-secondary
            $family-code
            $size-small
            $size-normal
            $size-medium
            $size-large
        color maps:
            $colors
            $shades
            $sizes

Component Sass variables
#

All Bulma components define its own Sass variables. For example, components/breadcrumb.scss define the following:
Sass and CSS variables
#
Sass Variable
	
Value

$breadcrumb-item-color

var(--bulma-link-text)

$breadcrumb-item-hover-color

var(--bulma-link-text-hover)

$breadcrumb-item-active-color

var(--bulma-link-text-active)

$breadcrumb-item-padding-vertical

0

$breadcrumb-item-padding-horizontal

0.75em

$breadcrumb-item-separator-color

var(--bulma-border)

Global CSS Variables
#

Bulma uses global CSS variables defined at the :root level. They are all prefixed with bulma-:

:root {
  /* Colors and Lightness values */
  --bulma-scheme-h: 221;
  --bulma-scheme-s: 14%;
  --bulma-light-l: 90%;
  --bulma-light-invert-l: 20%;
  --bulma-dark-l: 20%;
  --bulma-dark-invert-l: 90%;
  --bulma-soft-l: 90%;
  --bulma-bold-l: 20%;
  --bulma-soft-invert-l: 20%;
  --bulma-bold-invert-l: 90%;
  /* etc. */

  /* Color Palettes */
  --bulma-primary: hsla(var(--bulma-primary-h), var(--bulma-primary-s), var(--bulma-primary-l), 1);
  --bulma-primary-base: hsla(var(--bulma-primary-h), var(--bulma-primary-s), var(--bulma-primary-l), 1);
  --bulma-primary-rgb: 0, 209, 178;
  --bulma-primary-h: 171deg;
  --bulma-primary-s: 100%;
  --bulma-primary-l: 41%;
  --bulma-primary-00-l: 1%;
  --bulma-primary-05-l: 6%;
  --bulma-primary-10-l: 11%;
  --bulma-primary-15-l: 16%;
  --bulma-primary-20-l: 21%;
  /* etc. */

  /* Typography */
  --bulma-family-primary: Inter, SF Pro, Segoe UI, Roboto, Oxygen, Ubuntu, Helvetica Neue, Helvetica, Arial, sans-serif;
  --bulma-family-secondary: Inter, SF Pro, Segoe UI, Roboto, Oxygen, Ubuntu, Helvetica Neue, Helvetica, Arial, sans-serif;
  --bulma-family-code: Inconsolata, Hack, SF Mono, Roboto Mono, Source Code Pro, Ubuntu Mono, monospace;
  --bulma-size-small: 0.75rem;
  --bulma-size-normal: 1rem;
  --bulma-size-medium: 1.25rem;
  --bulma-size-large: 1.5rem;
  /* etc. */
}

You can overwrite them simply by setting a new value at the same scope (or even a more specific one):

:root {
  /* Set new values */
  --bulma-scheme-h: 35;
  --bulma-scheme-s: 20%;
}

Components CSS Variables
#

Bulma is also styled at the component level. For example, here is how the .title element is styled:

.title {
  --bulma-title-color: var(--bulma-text-strong);
  --bulma-title-family: false;
  --bulma-title-size: var(--bulma-size-3);
  --bulma-title-weight: var(--bulma-weight-extrabold);
  --bulma-title-line-height: 1.125;
  --bulma-title-strong-color: inherit;
  --bulma-title-strong-weight: inherit;
  --bulma-title-sub-size: 0.75em;
  --bulma-title-sup-size: 0.75em;
}

.title {
  color: var(--bulma-title-color);
  font-size: var(--bulma-title-size);
  font-weight: var(--bulma-title-weight);
  line-height: var(--bulma-title-line-height);
}

You can overwrite this simply by setting new values under the same scope:

.title {
  --bulma-title-color: #fff;
  --bulma-title-line-height: 1.6;
}



Customize with Sass

Customize Bulma with Sass variables
CSS Masterclass

Bulma is built using Sass. It uses Sass variables to define colors, sizes, spacing, and other aspects of the framework.
Install the dependencies
#

To customize Bulma with Sass, you first need to install Sass. The recommended approach is to use the sass npm package.

npm install sass
npm install bulma

In your package.json, add one script to build Bulma, one to build and watch for changes:

"build-bulma": "sass --load-path=node_modules my-bulma-project.scss my-bulma-project.css",
"start": "npm run build-bulma -- --watch"

Your whole package.json should look like this:

{
  "dependencies": {
    "bulma": "^1.0.0",
    "sass": "^1.72.0"
  },
  "scripts": {
    "build-bulma": "sass --load-path=node_modules my-bulma-project.scss my-bulma-project.css",
    "start": "npm run build-bulma -- --watch"
  }
}

Create your Sass file
#

Next to your package.json, create a my-bulma-project.scss file.

To overwrite Bulma’s Sass variables with your own value, write @use and the with keyword, which takes a Sass map:

// Set your brand colors
$purple: #8a4d76;
$pink: #fa7c91;
$brown: #757763;
$beige-light: #d0d1cd;
$beige-lighter: #eff0eb;

// Path to Bulma's sass folder
@use "bulma/sass" with (
  $family-primary: '"Nunito", sans-serif',
  $grey-dark: $brown,
  $grey-light: $beige-light,
  $primary: $purple,
  $link: $pink,
  $control-border-width: 2px,
  $input-shadow: none
);

// Import the Google Font
@import url("https://fonts.googleapis.com/css?family=Nunito:400,700");

Test out your setup by running the following command:

npm run build-bulma

You should see 2 files appearing next to the other ones:

    my-bulma-project.css, your CSS output file
    my-bulma-project.css.map, an optional source map

Add an HTML page
#

To view your Bulma project come to life, create an index.html page with the following content:

<!doctype html>
<html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Hello Bulma!</title>
    <link rel="stylesheet" href="my-bulma-project.css">
  </head>
  <body>
    <section class="section">
      <div class="container">
        <h1 class="title">Bulma</h1>
        <p class="subtitle">
          Modern CSS framework based on
          <a
            href="https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Flexible_Box_Layout/Basic_Concepts_of_Flexbox"
            >Flexbox</a
          >
        </p>
        <div class="field">
          <div class="control">
            <input class="input" type="text" placeholder="Input">
          </div>
        </div>
        <div class="field">
          <p class="control">
            <span class="select">
              <select>
                <option>Select dropdown</option>
              </select>
            </span>
          </p>
        </div>
        <div class="buttons">
          <a class="button is-primary">Primary</a>
          <a class="button is-link">Link</a>
        </div>
      </div>
    </section>
  </body>
</html>

Final result
#

Your project folder should look like this:
	index.html
	my-bulma-project.css
	my-bulma-project.css.map
	my-bulma-project.scss
	package.json

And your final page will look like this:
Your final Bulma page



Customize with Modular Sass

Import only what you need and customize it
CSS Masterclass

You can import only what you need from Bulma, and customize it with your own Sass values.

To achieve this:

    set your own Sass variables
    import bulma/sass/utilities
    override Bulma’s variables by providing the with keyword with your own Sass map
    if you need to, do the same for the bulma/sass/form folder
    import the Bulma components you need with either @use or @forward
    finally, import the Bulma themes from bulma/sass/themes

// Set your brand colors
$purple: #8a4d76;
$pink: #fa7c91;
$brown: #757763;
$beige-light: #d0d1cd;
$beige-lighter: #eff0eb;

// Override global Sass variables from the /utilities folder
@use "bulma/sass/utilities" with (
  $family-primary: '"Nunito", sans-serif',
  $grey-dark: $brown,
  $grey-light: $beige-light,
  $primary: $purple,
  $link: $pink,
  $control-border-width: 2px
);

// Override Sass variables from the /form folder
@use "bulma/sass/form" with (
  $input-shadow: none
);

// Import the components you need
@forward "bulma/sass/base";
@forward "bulma/sass/components/card";
@forward "bulma/sass/components/modal";
@forward "bulma/sass/components/navbar";
@forward "bulma/sass/elements/button";
@forward "bulma/sass/elements/icon";
@forward "bulma/sass/elements/content";
@forward "bulma/sass/elements/notification";
@forward "bulma/sass/elements/progress";
@forward "bulma/sass/elements/tag";
@forward "bulma/sass/layout/footer";

// Import the themes so that all CSS variables have a value
@forward "bulma/sass/themes";

// Import the Google Font
@import url("https://fonts.googleapis.com/css?family=Nunito:400,700");

This allows you to override Bulma’s:

    global variables from the utilities folder
    form variables from the form folder

If you wanted to import a component and customize it, do the same when importing it:

@use "bulma/sass/elements/image" with (
  $dimensions: 20 40 80 160,
);





Customize with CSS Variables

See how Bulma uses Sass variables to allow easy customization
CSS Masterclass

Bulma makes wide use of CSS Variables (also called CSS custom properties). Read more about them on the dedicated page.
Customizing in the browser
#

You can change the current Bulma simply by opening your developer console and changing a CSS variable’s value.

If you set your CSS variables under the :root scope, you are overwriting Bulma’s default theme. This can be done by with Sass or CSS.

To test out this CSS method, simply follow these steps:

Open your browser inspector
	Step

Select the html element
	Step

Insert a new value for the --bulma-link-h variable (the hue of the link color)
	Step

Notice how the CSS Helpers section in the side menu changes color
	Step

  

List of Bulma Sass variables

All Sass variables defined by Bulma
CSS Masterclass
Initial variables
#
Defined at utilities/initial-variables.scss.
Sass and CSS variables
#
Sass Variable
	
Value

$black

hsl(221, 14%, 4%)

$black-bis

hsl(221, 14%, 9%)

$black-ter

hsl(221, 14%, 14%)

$grey-darker

hsl(221, 14%, 21%)

$grey-dark

hsl(221, 14%, 29%)

$grey

hsl(221, 14%, 48%)

$grey-light

hsl(221, 14%, 71%)

$grey-lighter

hsl(221, 14%, 86%)

$grey-lightest

hsl(221, 14%, 93%)

$white-ter

hsl(221, 14%, 96%)

$white-bis

hsl(221, 14%, 98%)

$white

hsl(221, 14%, 100%)

$orange

hsl(14, 100%, 53%)

$yellow

hsl(42, 100%, 53%)

$green

hsl(153, 53%, 53%)

$turquoise

hsl(171, 100%, 41%)

$cyan

hsl(198, 100%, 70%)

$blue

hsl(233, 100%, 63%)

$purple

hsl(271, 100%, 71%)

$red

hsl(348, 100%, 70%)

$family-sans-serif

"Inter", "SF Pro", "Segoe UI", "Roboto", "Oxygen", "Ubuntu",
  "Helvetica Neue", "Helvetica", "Arial", sans-serif

$family-monospace

"Inconsolata", "Hack", "SF Mono", "Roboto Mono",
  "Source Code Pro", "Ubuntu Mono", monospace

$render-mode

optimizeLegibility

$size-1

3rem

$size-2

2.5rem

$size-3

2rem

$size-4

1.5rem

$size-5

1.25rem

$size-6

1rem

$size-7

0.75rem

$weight-light

300

$weight-normal

400

$weight-medium

500

$weight-semibold

600

$weight-bold

700

$weight-extrabold

800

$block-spacing

1.5rem

$aspect-ratios

(
  (1, 1),
  (5, 4),
  (4, 3),
  (3, 2),
  (5, 3),
  (16, 9),
  (2, 1),
  (3, 1),
  (4, 5),
  (3, 4),
  (2, 3),
  (3, 5),
  (9, 16),
  (1, 2),
  (1, 3)
)

$gap

32px

$tablet

769px

$desktop

960px + 2 * $gap

$widescreen

1152px + 2 * $gap

$widescreen-enabled

true

$fullhd

1344px + 2 * $gap

$fullhd-enabled

true

$breakpoints

(
  "mobile": (
    "until": $tablet,
  ),
  "tablet": (
    "from": $tablet,
  ),
  "tablet-only": (
    "from": $tablet,
    "until": $desktop,
  ),
  "touch": (
    "from": $desktop,
  ),
  "desktop": (
    "from": $desktop,
  ),
  "desktop-only": (
    "from": $desktop,
    "until": $widescreen,
  ),
  "until-widescreen": (
    "until": $widescreen,
  ),
  "widescreen": (
    "from": $widescreen,
  ),
  "widescreen-only": (
    "from": $widescreen,
    "until": $fullhd,
  ),
  "until-fullhd": (
    "until": $fullhd,
  ),
  "fullhd": (
    "from": $fullhd,
  ),
)

$duration

294ms

$easing

ease-out

$radius-small

0.25rem

$radius

0.375rem

$radius-medium

0.5em

$radius-large

0.75rem

$radius-rounded

9999px

$speed

86ms

$variable-columns

true

$rtl

false

$class-prefix

""

$cssvars-prefix

"bulma-"

$helpers-prefix

"is-"

$helpers-has-prefix

"has-"

Derived variables
#
Defined at utilities/derived-variables.scss.
Sass and CSS variables
#
Sass Variable
	
Value

$scheme-main

iv.$white

$scheme-main-bis

iv.$white-bis

$scheme-main-ter

iv.$white-ter

$scheme-invert

iv.$black

$scheme-invert-bis

iv.$black-bis

$scheme-invert-ter

iv.$black-ter

$text

iv.$grey-dark

$text-invert

fn.bulmaFindColorInvert($text)

$text-weak

iv.$grey

$text-strong

iv.$grey-darker

$primary

iv.$turquoise

$info

iv.$cyan

$success

iv.$green

$warning

iv.$yellow

$danger

iv.$red

$light

iv.$white-ter

$dark

iv.$grey-darker

$link

iv.$blue

$background

iv.$white-ter

$border

iv.$grey-lighter

$border-weak

iv.$grey-lightest

$code

iv.$red

$code-background

$background

$pre

$text

$pre-background

$background

$family-primary

iv.$family-sans-serif

$family-secondary

iv.$family-sans-serif

$family-code

iv.$family-monospace

$size-small

iv.$size-7

$size-normal

iv.$size-6

$size-medium

iv.$size-5

$size-large

iv.$size-4

$shadow-color

iv.$black

$custom-colors

null

$custom-shades

null

$colors

fn.mergeColorMaps(
  (
    "white": (
      iv.$white,
      iv.$black,
    ),
    "black": (
      iv.$black,
      iv.$white,
    ),
    "light": (
      $light,
      $dark,
    ),
    "dark": (
      $dark,
      $light,
    ),
    "text": $text,
    "primary": $primary,
    "link": $link,
    "info": $info,
    "success": $success,
    "warning": $warning,
    "danger": $danger,
  ),
  $custom-colors
)

$shades

fn.mergeColorMaps(
  (
    "black-bis": iv.$black-bis,
    "black-ter": iv.$black-ter,
    "grey-darker": iv.$grey-darker,
    "grey-dark": iv.$grey-dark,
    "grey": iv.$grey,
    "grey-light": iv.$grey-light,
    "grey-lighter": iv.$grey-lighter,
    "white-ter": iv.$white-ter,
    "white-bis": iv.$white-bis,
  ),
  $custom-shades
)

$sizes

iv.$size-1 iv.$size-2 iv.$size-3 iv.$size-4 iv.$size-5 iv.$size-6
  iv.$size-7

Component variables
#
For each Bulma component, the list of Sass variables is listed at the bottom of its page. 



Color helpers

Change the color of the text and/or background
CSS Masterclass
Text color
#

You can set any element to one of the 10 colors or 9 shades of grey:
Class 	Color 	Example
has-text-white 	hsl(0, 0%, 100%) 	Hello Bulma
has-text-black 	hsl(0, 0%, 4%) 	Hello Bulma
has-text-light 	hsl(0, 0%, 96%) 	Hello Bulma
has-text-dark 	hsl(0, 0%, 21%) 	Hello Bulma
has-text-primary 	hsl(171, 100%, 41%) 	Hello Bulma
has-text-link 	hsl(217, 71%, 53%) 	Hello Bulma
has-text-info 	hsl(204, 86%, 53%) 	Hello Bulma
has-text-success 	hsl(141, 71%, 48%) 	Hello Bulma
has-text-warning 	hsl(48, 100%, 67%) 	Hello Bulma
has-text-danger 	hsl(348, 100%, 61%) 	Hello Bulma
Class 	Shade 	Example
has-text-black-bis 	hsl(0, 0%, 7%) 	Hello Bulma
has-text-black-ter 	hsl(0, 0%, 14%) 	Hello Bulma
has-text-grey-darker 	hsl(0, 0%, 21%) 	Hello Bulma
has-text-grey-dark 	hsl(0, 0%, 29%) 	Hello Bulma
has-text-grey 	hsl(0, 0%, 48%) 	Hello Bulma
has-text-grey-light 	hsl(0, 0%, 71%) 	Hello Bulma
has-text-grey-lighter 	hsl(0, 0%, 86%) 	Hello Bulma
has-text-white-ter 	hsl(0, 0%, 96%) 	Hello Bulma
has-text-white-bis 	hsl(0, 0%, 98%) 	Hello Bulma

You can use each color in their light and dark versions. Simply append *-light or *-dark.
Class 	Light/Dark color 	Example
has-text-primary-light 	hsl(171, 100%, 96%) 	Hello Bulma
has-text-link-light 	hsl(219, 70%, 96%) 	Hello Bulma
has-text-info-light 	hsl(206, 70%, 96%) 	Hello Bulma
has-text-success-light 	hsl(142, 52%, 96%) 	Hello Bulma
has-text-warning-light 	hsl(48, 100%, 96%) 	Hello Bulma
has-text-danger-light 	hsl(347, 90%, 96%) 	Hello Bulma
has-text-primary-dark 	hsl(171, 100%, 29%) 	Hello Bulma
has-text-link-dark 	hsl(217, 71%, 45%) 	Hello Bulma
has-text-info-dark 	hsl(204, 71%, 39%) 	Hello Bulma
has-text-success-dark 	hsl(141, 53%, 31%) 	Hello Bulma
has-text-warning-dark 	hsl(48, 100%, 29%) 	Hello Bulma
has-text-danger-dark 	hsl(348, 86%, 43%) 	Hello Bulma

You can also inherit the color, or use the current one:
Class 	Value 	Example
has-text-current 	currentColor 	Hello Bulma
has-text-inherit 	inherit 	Hello Bulma
Background color
#

You can set any element to one of the 10 colors or 9 shades of grey:
Class 	Background color
has-background-white 	hsl(0, 0%, 100%) 	
has-background-black 	hsl(0, 0%, 4%) 	
has-background-light 	hsl(0, 0%, 96%) 	
has-background-dark 	hsl(0, 0%, 21%) 	
has-background-primary 	hsl(171, 100%, 41%) 	
has-background-link 	hsl(217, 71%, 53%) 	
has-background-info 	hsl(204, 86%, 53%) 	
has-background-success 	hsl(141, 71%, 48%) 	
has-background-warning 	hsl(48, 100%, 67%) 	
has-background-danger 	hsl(348, 100%, 61%) 	
Class 	Background shade
has-background-black-bis 	hsl(0, 0%, 7%) 	
has-background-black-ter 	hsl(0, 0%, 14%) 	
has-background-grey-darker 	hsl(0, 0%, 21%) 	
has-background-grey-dark 	hsl(0, 0%, 29%) 	
has-background-grey 	hsl(0, 0%, 48%) 	
has-background-grey-light 	hsl(0, 0%, 71%) 	
has-background-grey-lighter 	hsl(0, 0%, 86%) 	
has-background-white-ter 	hsl(0, 0%, 96%) 	
has-background-white-bis 	hsl(0, 0%, 98%) 	

You can use each color in their light and dark versions. Simply append *-light or *-dark.
Class 	Light/Dark background 	Example
has-background-primary-light 	hsl(171, 100%, 96%) 	Hello Bulma
has-background-link-light 	hsl(219, 70%, 96%) 	Hello Bulma
has-background-info-light 	hsl(206, 70%, 96%) 	Hello Bulma
has-background-success-light 	hsl(142, 52%, 96%) 	Hello Bulma
has-background-warning-light 	hsl(48, 100%, 96%) 	Hello Bulma
has-background-danger-light 	hsl(347, 90%, 96%) 	Hello Bulma
has-background-primary-dark 	hsl(171, 100%, 29%) 	Hello Bulma
has-background-link-dark 	hsl(217, 71%, 45%) 	Hello Bulma
has-background-info-dark 	hsl(204, 71%, 39%) 	Hello Bulma
has-background-success-dark 	hsl(141, 53%, 31%) 	Hello Bulma
has-background-warning-dark 	hsl(48, 100%, 29%) 	Hello Bulma
has-background-danger-dark 	hsl(348, 86%, 43%) 	Hello Bulma

You can also inherit the background color, or use the current color as background one:
Class 	Value 	Example
has-background-current 	currentColor 	Hello Bulma
has-background-inherit 	inherit 	Hello Bulma



Color Palette helpers

Use a color’s palette as text color and/or background
CSS Masterclass

Bulma comes with 7 primary colors:
text	
link	
primary	
info	
success	
warning	
danger	

Bulma will automatically generate a collection of shades for each of those colors. These act as a color palette you can use to play with different variants of a same color.
Text color
#
Bulma comes with CSS classes for 27 shades of each color. Each shade also comes with an invert equivalent, that is useful to combine in a foreground/background combination.
Class 	Code 	Example 	Invert
has-text-primary 	

<p class="has-text-primary">Hello Bulma</p>

Hello Bulma 		Hello Bulma 	
has-text-primary-00 	

<p class="has-text-primary-00">Hello Bulma</p>

Hello Bulma 		Hello Bulma 	
has-text-primary-05 	

<p class="has-text-primary-05">Hello Bulma</p>

Hello Bulma 		Hello Bulma 	
has-text-primary-10 	

<p class="has-text-primary-10">Hello Bulma</p>

Hello Bulma 		Hello Bulma 	
has-text-primary-15 	

<p class="has-text-primary-15">Hello Bulma</p>

Hello Bulma 		Hello Bulma 	
has-text-primary-20 	

<p class="has-text-primary-20">Hello Bulma</p>

Hello Bulma 		Hello Bulma 	
has-text-primary-25 	

<p class="has-text-primary-25">Hello Bulma</p>

Hello Bulma 		Hello Bulma 	
has-text-primary-30 	

<p class="has-text-primary-30">Hello Bulma</p>

Hello Bulma 		Hello Bulma 	
has-text-primary-35 	

<p class="has-text-primary-35">Hello Bulma</p>

Hello Bulma 		Hello Bulma 	
has-text-primary-40 	

<p class="has-text-primary-40">Hello Bulma</p>

Hello Bulma 		Hello Bulma 	
has-text-primary-45 	

<p class="has-text-primary-45">Hello Bulma</p>

Hello Bulma 		Hello Bulma 	
has-text-primary-50 	

<p class="has-text-primary-50">Hello Bulma</p>

Hello Bulma 		Hello Bulma 	
has-text-primary-55 	

<p class="has-text-primary-55">Hello Bulma</p>

Hello Bulma 		Hello Bulma 	
has-text-primary-60 	

<p class="has-text-primary-60">Hello Bulma</p>

Hello Bulma 		Hello Bulma 	
has-text-primary-65 	

<p class="has-text-primary-65">Hello Bulma</p>

Hello Bulma 		Hello Bulma 	
has-text-primary-70 	

<p class="has-text-primary-70">Hello Bulma</p>

Hello Bulma 		Hello Bulma 	
has-text-primary-75 	

<p class="has-text-primary-75">Hello Bulma</p>

Hello Bulma 		Hello Bulma 	
has-text-primary-80 	

<p class="has-text-primary-80">Hello Bulma</p>

Hello Bulma 		Hello Bulma 	
has-text-primary-85 	

<p class="has-text-primary-85">Hello Bulma</p>

Hello Bulma 		Hello Bulma 	
has-text-primary-90 	

<p class="has-text-primary-90">Hello Bulma</p>

Hello Bulma 		Hello Bulma 	
has-text-primary-95 	

<p class="has-text-primary-95">Hello Bulma</p>

Hello Bulma 		Hello Bulma 	
has-text-primary-100 	

<p class="has-text-primary-100">Hello Bulma</p>

Hello Bulma 		Hello Bulma 	
has-text-primary-light 	

<p class="has-text-primary-light">Hello Bulma</p>

Hello Bulma 		Hello Bulma 	
has-text-primary-dark 	

<p class="has-text-primary-dark">Hello Bulma</p>

Hello Bulma 		Hello Bulma 	
has-text-primary-soft 	

<p class="has-text-primary-soft">Hello Bulma</p>

Hello Bulma 		Hello Bulma 	
has-text-primary-bold 	

<p class="has-text-primary-bold">Hello Bulma</p>

Hello Bulma 		Hello Bulma 	
has-text-primary-on-scheme 	

<p class="has-text-primary-on-scheme">Hello Bulma</p>

Hello Bulma 		Hello Bulma 	
Background color
#
All 27 shades are also available as background helpers. Combined with the invert color as foreground, it's easy to make readable elements with just 2 classes.
Class 	Code 	Example 	Swatch
has-background-primary 	

<p class="has-background-primary has-text-primary-invert">
Hello Bulma
</p>

Hello Bulma 	
has-background-primary-00 	

<p class="has-background-primary-00 has-text-primary-00-invert">
Hello Bulma
</p>

Hello Bulma 	
has-background-primary-05 	

<p class="has-background-primary-05 has-text-primary-05-invert">
Hello Bulma
</p>

Hello Bulma 	
has-background-primary-10 	

<p class="has-background-primary-10 has-text-primary-10-invert">
Hello Bulma
</p>

Hello Bulma 	
has-background-primary-15 	

<p class="has-background-primary-15 has-text-primary-15-invert">
Hello Bulma
</p>

Hello Bulma 	
has-background-primary-20 	

<p class="has-background-primary-20 has-text-primary-20-invert">
Hello Bulma
</p>

Hello Bulma 	
has-background-primary-25 	

<p class="has-background-primary-25 has-text-primary-25-invert">
Hello Bulma
</p>

Hello Bulma 	
has-background-primary-30 	

<p class="has-background-primary-30 has-text-primary-30-invert">
Hello Bulma
</p>

Hello Bulma 	
has-background-primary-35 	

<p class="has-background-primary-35 has-text-primary-35-invert">
Hello Bulma
</p>

Hello Bulma 	
has-background-primary-40 	

<p class="has-background-primary-40 has-text-primary-40-invert">
Hello Bulma
</p>

Hello Bulma 	
has-background-primary-45 	

<p class="has-background-primary-45 has-text-primary-45-invert">
Hello Bulma
</p>

Hello Bulma 	
has-background-primary-50 	

<p class="has-background-primary-50 has-text-primary-50-invert">
Hello Bulma
</p>

Hello Bulma 	
has-background-primary-55 	

<p class="has-background-primary-55 has-text-primary-55-invert">
Hello Bulma
</p>

Hello Bulma 	
has-background-primary-60 	

<p class="has-background-primary-60 has-text-primary-60-invert">
Hello Bulma
</p>

Hello Bulma 	
has-background-primary-65 	

<p class="has-background-primary-65 has-text-primary-65-invert">
Hello Bulma
</p>

Hello Bulma 	
has-background-primary-70 	

<p class="has-background-primary-70 has-text-primary-70-invert">
Hello Bulma
</p>

Hello Bulma 	
has-background-primary-75 	

<p class="has-background-primary-75 has-text-primary-75-invert">
Hello Bulma
</p>

Hello Bulma 	
has-background-primary-80 	

<p class="has-background-primary-80 has-text-primary-80-invert">
Hello Bulma
</p>

Hello Bulma 	
has-background-primary-85 	

<p class="has-background-primary-85 has-text-primary-85-invert">
Hello Bulma
</p>

Hello Bulma 	
has-background-primary-90 	

<p class="has-background-primary-90 has-text-primary-90-invert">
Hello Bulma
</p>

Hello Bulma 	
has-background-primary-95 	

<p class="has-background-primary-95 has-text-primary-95-invert">
Hello Bulma
</p>

Hello Bulma 	
has-background-primary-100 	

<p class="has-background-primary-100 has-text-primary-100-invert">
Hello Bulma
</p>

Hello Bulma 	
has-background-primary-light 	

<p class="has-background-primary-light has-text-primary-light-invert">
Hello Bulma
</p>

Hello Bulma 	
has-background-primary-dark 	

<p class="has-background-primary-dark has-text-primary-dark-invert">
Hello Bulma
</p>

Hello Bulma 	
has-background-primary-soft 	

<p class="has-background-primary-soft has-text-primary-soft-invert">
Hello Bulma
</p>

Hello Bulma 	
has-background-primary-bold 	

<p class="has-background-primary-bold has-text-primary-bold-invert">
Hello Bulma
</p>

Hello Bulma 	
has-background-primary-on-scheme 	

<p class="has-background-primary-on-scheme has-text-primary-on-scheme-invert">
Hello Bulma
</p>

Hello Bulma 	



Spacing helpers

Change the size and color of the text for one or multiple viewport width
CSS Masterclass

Bulma provides margin m* and padding p* helpers in all directions:

    *t for top
    *r for right
    *b for bottom
    *l for left
    *x horizontally for both left and right
    *y vertically for both top and bottom

You need to combine a margin/padding prefix with a direction suffix. For example:

    for a margin-top, use mt-*
    for a padding-bottom, use pb-*
    for both margin-left and margin-right, use mx-*

Each of these property-direction combinations needs to be appended with one of 6 value suffixes:
Suffix 	Value
*-0 	0
*-1 	0.25rem
*-2 	0.5rem
*-3 	0.75rem
*-4 	1rem
*-5 	1.5rem
*-6 	3rem
List of all spacing helpers
#

There are 112 spacing helpers to choose from:
Property 	Shortcut 	Classes ↓
Values → 	0 	0.25rem 	0.5rem 	0.75rem 	1rem 	1.5rem 	3rem 	auto
margin 	m 	m-0 	m-1 	m-2 	m-3 	m-4 	m-5 	m-6 	m-auto
margin-top 	mt 	mt-0 	mt-1 	mt-2 	mt-3 	mt-4 	mt-5 	mt-6 	mt-auto
margin-right 	mr 	mr-0 	mr-1 	mr-2 	mr-3 	mr-4 	mr-5 	mr-6 	mr-auto
margin-bottom 	mb 	mb-0 	mb-1 	mb-2 	mb-3 	mb-4 	mb-5 	mb-6 	mb-auto
margin-left 	ml 	ml-0 	ml-1 	ml-2 	ml-3 	ml-4 	ml-5 	ml-6 	ml-auto
margin-left and
margin-right 	mx 	mx-0 	mx-1 	mx-2 	mx-3 	mx-4 	mx-5 	mx-6 	mx-auto
margin-top and
margin-bottom 	my 	my-0 	my-1 	my-2 	my-3 	my-4 	my-5 	my-6 	my-auto
padding 	p 	p-0 	p-1 	p-2 	p-3 	p-4 	p-5 	p-6 	p-auto
padding-top 	pt 	pt-0 	pt-1 	pt-2 	pt-3 	pt-4 	pt-5 	pt-6 	pt-auto
padding-right 	pr 	pr-0 	pr-1 	pr-2 	pr-3 	pr-4 	pr-5 	pr-6 	pr-auto
padding-bottom 	pb 	pb-0 	pb-1 	pb-2 	pb-3 	pb-4 	pb-5 	pb-6 	pb-auto
padding-left 	pl 	pl-0 	pl-1 	pl-2 	pl-3 	pl-4 	pl-5 	pl-6 	pl-auto
padding-left and
padding-right 	px 	px-0 	px-1 	px-2 	px-3 	px-4 	px-5 	px-6 	px-auto
padding-top and
padding-bottom 	py 	py-0 	py-1 	py-2 	py-3 	py-4 	py-5 	py-6 	py-auto

To use these classes, simply append them to any HTML element:

<!-- Adds 1rem of margin at the bottom -->
<p class="mb-4">Margin bottom</p>

<!-- Adds 0.25rem of padding on the left and the right -->
<p class="px-1">Horizontal padding</p>

<!-- Removes the margin on the right and adds 0.75rem padding at the top -->
<p class="mr-0 pt-3">Both</p>

Configuration
#

Because every developer has their own preferences, and to satisfy Bulma's customization features, it's possible to specify your own class name shortcuts as well as the spacing values.

For example, if you wanted:

    margin to be abbreviated to mg
    padding to be totally excluded
    horizontal to be abbreviated to h
    vertical to be excluded as well
    and to only have 3 values: "small" at 10px, "medium" at 30px, and "large" at 60px

You can simplify the CSS output by customizing these SCSS variables:

 $spacing-shortcuts: ("margin": "mg"); $spacing-horizontal:
"h"; $spacing-vertical: null; $spacing-values: ("small": 10px, "medium": 30px,
"large": 60px); 

Property 	Shortcut 	Classes ↓
Values → 	10px 	30px 	60px
margin 	mg 	mg-small 	mg-medium 	mg-large
margin-top 	mgt 	mgt-small 	mgt-medium 	mgt-large
margin-right 	mgr 	mgr-small 	mgr-medium 	mgr-large
margin-bottom 	mgb 	mgb-small 	mgb-medium 	mgb-large
margin-left 	mgl 	mgl-small 	mgl-medium 	mgl-large
margin-left and
margin-right 	mgh 	mgh-small 	mgh-medium 	mgh-large

By customizing the output, you've narrowed down the list of spacing helpers from 112 to only 18. 



Typography helpers

Change the size, weight, and other font properties of the text
CSS Masterclass
Size
#

There are 7 sizes to choose from:
Class 	Font-size 	Size
is-size-1 	3rem 	Example
is-size-2 	2.5rem 	Example
is-size-3 	2rem 	Example
is-size-4 	1.5rem 	Example
is-size-5 	1.25rem 	Example
is-size-6 	1rem 	Example
is-size-7 	0.75rem 	Example
Responsive size
#

You can choose a specific size for each viewport width. You simply need to append the viewport width to the size modifier.

For example, here are the modifiers for $size-1:
Class 	Mobile
Up to 768px 	Tablet
Between 769px and 1023px 	Desktop
Between 1024px and 1215px 	Widescreen
Between 1216px and 1407px 	FullHD
1408px and above
is-size-1-mobile 		unchanged 	unchanged 	unchanged 	unchanged
is-size-1-touch 			unchanged 	unchanged 	unchanged
is-size-1-tablet 	unchanged 				
is-size-1-desktop 	unchanged 	unchanged 			
is-size-1-widescreen 	unchanged 	unchanged 	unchanged 		
is-size-1-fullhd 	unchanged 	unchanged 	unchanged 	unchanged 	

You can use the same logic for each of the 7 sizes.
Alignment
#

You can align the text with the use of one of 4 alignment helpers:
Class 	Alignment
has-text-centered 	Makes the text centered
has-text-justified 	Makes the text justified
has-text-left 	Makes the text aligned to the left
has-text-right 	Makes the text aligned to the right
Responsive Alignment
#

You can align text differently for each viewport width. Simply append the viewport width to the alignment modifier.

For example, here are the modifiers for has-text-left:
Class 	Mobile
Up to 768px 	Tablet
Between 769px and 1023px 	Desktop
Between 1024px and 1215px 	Widescreen
Between 1216px and 1407px 	FullHD
1408px and above
has-text-left-mobile 	left-aligned 	unchanged 	unchanged 	unchanged 	unchanged
has-text-left-touch 	left-aligned 	left-aligned 	unchanged 	unchanged 	unchanged
has-text-left-tablet-only 	unchanged 	left-aligned 	unchanged 	unchanged 	unchanged
has-text-left-tablet 	unchanged 	left-aligned 	left-aligned 	left-aligned 	left-aligned
has-text-left-desktop-only 	unchanged 	unchanged 	left-aligned 	unchanged 	unchanged
has-text-left-desktop 	unchanged 	unchanged 	left-aligned 	left-aligned 	left-aligned
has-text-left-widescreen-only 	unchanged 	unchanged 	unchanged 	left-aligned 	unchanged
has-text-left-widescreen 	unchanged 	unchanged 	unchanged 	left-aligned 	left-aligned
has-text-left-fullhd 	unchanged 	unchanged 	unchanged 	unchanged 	left-aligned

You can use the same logic for each of the 4 alignments.
Text transformation
#

You can transform the text with the use of one of 4 text transformation helpers:
Class 	Transformation
is-capitalized 	Transforms the first character of each word to Uppercase
is-lowercase 	Transforms all characters to lowercase
is-uppercase 	Transforms all characters to UPPERCASE
is-italic 	Transforms all characters to italic
is-underlined 	Underlines the text
Text weight
#

You can transform the text weight with the use of one of 6 text weight helpers:
Class 	Weight
has-text-weight-light 	Transforms text weight to light
has-text-weight-normal 	Transforms text weight to normal
has-text-weight-medium 	Transforms text weight to medium
has-text-weight-semibold 	Transforms text weight to semibold
has-text-weight-bold 	Transforms text weight to bold
has-text-weight-extrabold 	Transforms text weight to extrabold
Font family
#

You can change the font family with the use of one of 5 font family helpers:
Class 	Family
is-family-sans-serif 	Sets font family to $family-sans-serif
is-family-monospace 	Sets font family to $family-monospace
is-family-primary 	Sets font family to $family-primary
is-family-secondary 	Sets font family to $family-secondary
is-family-code 	Sets font family to $family-code



Responsive helpers

Show/hide content depending on the width of the viewport
CSS Masterclass
Show
#

You can use one of the following display classes:

    is-block
    is-flex
    is-inline
    is-inline-block
    is-inline-flex

For example, here's how the is-flex helper works:
Class 	Mobile
Up to 768px 	Tablet
Between 769px and 1023px 	Desktop
Between 1024px and 1215px 	Widescreen
Between 1216px and 1407px 	FullHD
1408px and above
is-flex-mobile 	Flex 	Unchanged 	Unchanged 	Unchanged 	Unchanged
is-flex-tablet-only 	Unchanged 	Flex 	Unchanged 	Unchanged 	Unchanged
is-flex-desktop-only 	Unchanged 	Unchanged 	Flex 	Unchanged 	Unchanged
is-flex-widescreen-only 	Unchanged 	Unchanged 	Unchanged 	Flex 	Unchanged

Classes to display up to or from a specific breakpoint
is-flex-touch 	Flex 	Flex 	Unchanged 	Unchanged 	Unchanged
is-flex-tablet 	Unchanged 	Flex 	Flex 	Flex 	Flex
is-flex-desktop 	Unchanged 	Unchanged 	Flex 	Flex 	Flex
is-flex-widescreen 	Unchanged 	Unchanged 	Unchanged 	Flex 	Flex
is-flex-fullhd 	Unchanged 	Unchanged 	Unchanged 	Unchanged 	Flex

For the other display options, just replace is-flex with is-block is-inline is-inline-block or is-inline-flex
Hide
#
Class 	Mobile
Up to 768px 	Tablet
Between 769px and 1023px 	Desktop
Between 1024px and 1215px 	Widescreen
Between 1216px and 1407px 	FullHD
1408px and above
is-hidden-mobile 	Hidden 	Visible 	Visible 	Visible 	Visible
is-hidden-tablet-only 	Visible 	Hidden 	Visible 	Visible 	Visible
is-hidden-desktop-only 	Visible 	Visible 	Hidden 	Visible 	Visible
is-hidden-widescreen-only 	Visible 	Visible 	Visible 	Hidden 	Visible

Classes to hide up to or from a specific breakpoint
is-hidden-touch 	Hidden 	Hidden 	Visible 	Visible 	Visible
is-hidden-tablet 	Visible 	Hidden 	Hidden 	Hidden 	Hidden
is-hidden-desktop 	Visible 	Visible 	Hidden 	Hidden 	Hidden
is-hidden-widescreen 	Visible 	Visible 	Visible 	Hidden 	Hidden
is-hidden-fullhd 	Visible 	Visible 	Visible 	Visible 	Hidden
Other visibility helpers
#
is-invisible 	Adds visibility hidden
is-hidden 	Hides element
is-sr-only 	Hide elements visually but keep the element available to be announced by a screen reader



Flexbox helpers

Helpers for all Flexbox properties
CSS Masterclass

Combined with is-flex, all of the Flexbox CSS properties are available as Bulma helpers:

    flex-direction
    flex-wrap
    justify-content
    align-content
    align-items
    align-self
    flex-grow
    flex-shrink

Flex direction
#
Class 	Property: Value
is-flex-direction-row 	flex-direction: row
is-flex-direction-row-reverse 	flex-direction: row-reverse
is-flex-direction-column 	flex-direction: column
is-flex-direction-column-reverse 	flex-direction: column-reverse
Flex wrap
#
Class 	Property: Value
is-flex-wrap-nowrap 	flex-wrap: nowrap
is-flex-wrap-wrap 	flex-wrap: wrap
is-flex-wrap-wrap-reverse 	flex-wrap: wrap-reverse
Justify content
#
Class 	Property: Value
is-justify-content-flex-start 	justify-content: flex-start
is-justify-content-flex-end 	justify-content: flex-end
is-justify-content-center 	justify-content: center
is-justify-content-space-between 	justify-content: space-between
is-justify-content-space-around 	justify-content: space-around
is-justify-content-space-evenly 	justify-content: space-evenly
is-justify-content-start 	justify-content: start
is-justify-content-end 	justify-content: end
is-justify-content-left 	justify-content: left
is-justify-content-right 	justify-content: right
Align content
#
Class 	Property: Value
is-align-content-flex-start 	align-content: flex-start
is-align-content-flex-end 	align-content: flex-end
is-align-content-center 	align-content: center
is-align-content-space-between 	align-content: space-between
is-align-content-space-around 	align-content: space-around
is-align-content-space-evenly 	align-content: space-evenly
is-align-content-stretch 	align-content: stretch
is-align-content-start 	align-content: start
is-align-content-end 	align-content: end
is-align-content-baseline 	align-content: baseline
Align items
#
Class 	Property: Value
is-align-items-stretch 	align-items: stretch
is-align-items-flex-start 	align-items: flex-start
is-align-items-flex-end 	align-items: flex-end
is-align-items-center 	align-items: center
is-align-items-baseline 	align-items: baseline
is-align-items-start 	align-items: start
is-align-items-end 	align-items: end
is-align-items-self-start 	align-items: self-start
is-align-items-self-end 	align-items: self-end
Align self
#
Class 	Property: Value
is-align-self-auto 	align-self: auto
is-align-self-flex-start 	align-self: flex-start
is-align-self-flex-end 	align-self: flex-end
is-align-self-center 	align-self: center
is-align-self-baseline 	align-self: baseline
is-align-self-stretch 	align-self: stretch
Flex grow and flex shrink
#
Class 	Property: Value
Grow
is-flex-grow-0 	flex-grow: 0
is-flex-grow-1 	flex-grow: 1
is-flex-grow-2 	flex-grow: 2
is-flex-grow-3 	flex-grow: 3
is-flex-grow-4 	flex-grow: 4
is-flex-grow-5 	flex-grow: 5
Shrink
is-flex-shrink-0 	flex-shrink: 0
is-flex-shrink-1 	flex-shrink: 1
is-flex-shrink-2 	flex-shrink: 2
is-flex-shrink-3 	flex-shrink: 3
is-flex-shrink-4 	flex-shrink: 4
is-flex-shrink-5 	flex-shrink: 5



Other helpers

Other useful Bulma helpers
CSS Masterclass

Here are some other helpers shipped with Bulma:
is-clearfix 	Fixes an element's floating children
is-pulled-left 	Moves an element to the left
is-pulled-right 	Moves an element to the right
is-overlay 	Completely covers the first positioned parent
is-clipped 	Adds overflow hidden
is-radiusless 	Removes any radius
is-shadowless 	Removes any shadow
is-unselectable 	Prevents the text from being selectable
is-clickable 	Applies cursor: pointer !important to the element.
is-relative 	Applies position: relative to the element.



Footer

A simple responsive footer which can include anything: lists, headings, columns, icons, buttons, etc.
CSS Masterclass

The Bulma footer is a simple container, with lots of bottom padding, making it great as the last element of any webpage.

Example

Bulma by Jeremy Thomas. The source code is licensed MIT. The website content is licensed CC BY NC SA 4.0.

HTML

<footer class="footer">
  <div class="content has-text-centered">
    <p>
      <strong>Bulma</strong> by <a href="https://jgthms.com">Jeremy Thomas</a>.
      The source code is licensed
      <a href="https://opensource.org/license/mit">MIT</a>. The
      website content is licensed
      <a href="https://creativecommons.org/licenses/by-nc-sa/4.0//"
        >CC BY NC SA 4.0</a
      >.
    </p>
  </div>
</footer>

Sass and CSS variables
#
Sass Variable
	
CSS Variable
	
Value

$footer-background-color

var(--bulma-footer-background-color)

var(--bulma-scheme-main-bis)

$footer-color

var(--bulma-footer-color)

false

$footer-padding

var(--bulma-footer-padding)

3rem 1.5rem 6rem



Media Object

The famous media object prevalent in social media interfaces, but useful in any context
CSS Masterclass

The media object is a UI element perfect for repeatable and nestable content.

Example

John Smith @johnsmith 31m
Lorem ipsum dolor sit amet, consectetur adipiscing elit. Proin ornare magna eros, eu pellentesque tortor vestibulum ut. Maecenas non massa sem. Etiam finibus odio quis feugiat facilisis.

HTML

<article class="media">
  <figure class="media-left">
    <p class="image is-64x64">
      <img src="https://bulma.io/assets/images/placeholders/128x128.png" />
    </p>
  </figure>
  <div class="media-content">
    <div class="content">
      <p>
        <strong>John Smith</strong> <small>@johnsmith</small> <small>31m</small>
        <br />
        Lorem ipsum dolor sit amet, consectetur adipiscing elit. Proin ornare
        magna eros, eu pellentesque tortor vestibulum ut. Maecenas non massa
        sem. Etiam finibus odio quis feugiat facilisis.
      </p>
    </div>
    <nav class="level is-mobile">
      <div class="level-left">
        <a class="level-item">
          <span class="icon is-small"><i class="fas fa-reply"></i></span>
        </a>
        <a class="level-item">
          <span class="icon is-small"><i class="fas fa-retweet"></i></span>
        </a>
        <a class="level-item">
          <span class="icon is-small"><i class="fas fa-heart"></i></span>
        </a>
      </div>
    </nav>
  </div>
  <div class="media-right">
    <button class="delete"></button>
  </div>
</article>

You can include any other Bulma element, like inputs, textareas, icons, buttons… or even a navbar.

Example

Press enter to submit

HTML

<article class="media">
  <figure class="media-left">
    <p class="image is-64x64">
      <img src="https://bulma.io/assets/images/placeholders/128x128.png" />
    </p>
  </figure>
  <div class="media-content">
    <div class="field">
      <p class="control">
        <textarea class="textarea" placeholder="Add a comment..."></textarea>
      </p>
    </div>
    <nav class="level">
      <div class="level-left">
        <div class="level-item">
          <a class="button is-info">Submit</a>
        </div>
      </div>
      <div class="level-right">
        <div class="level-item">
          <label class="checkbox">
            <input type="checkbox" /> Press enter to submit
          </label>
        </div>
      </div>
    </nav>
  </div>
</article>

Nesting
#

You can nest media objects up to 3 levels deep.

Example

Barbara Middleton
Lorem ipsum dolor sit amet, consectetur adipiscing elit. Duis porta eros lacus, nec ultricies elit blandit non. Suspendisse pellentesque mauris sit amet dolor blandit rutrum. Nunc in tempus turpis.
Like · Reply · 3 hrs

Sean Brown
Donec sollicitudin urna eget eros malesuada sagittis. Pellentesque habitant morbi tristique senectus et netus et malesuada fames ac turpis egestas. Aliquam blandit nisl a nulla sagittis, a lobortis leo feugiat.
Like · Reply · 2 hrs
Vivamus quis semper metus, non tincidunt dolor. Vivamus in mi eu lorem cursus ullamcorper sit amet nec massa.
Morbi vitae diam et purus tincidunt porttitor vel vitae augue. Praesent malesuada metus sed pharetra euismod. Cras tellus odio, tincidunt iaculis diam non, porta aliquet tortor.

Kayli Eunice
Sed convallis scelerisque mauris, non pulvinar nunc mattis vel. Maecenas varius felis sit amet magna vestibulum euismod malesuada cursus libero. Vestibulum ante ipsum primis in faucibus orci luctus et ultrices posuere cubilia Curae; Phasellus lacinia non nisl id feugiat.
Like · Reply · 2 hrs

HTML

<article class="media">
  <figure class="media-left">
    <p class="image is-64x64">
      <img src="https://bulma.io/assets/images/placeholders/128x128.png" />
    </p>
  </figure>
  <div class="media-content">
    <div class="content">
      <p>
        <strong>Barbara Middleton</strong>
        <br />
        Lorem ipsum dolor sit amet, consectetur adipiscing elit. Duis porta eros
        lacus, nec ultricies elit blandit non. Suspendisse pellentesque mauris
        sit amet dolor blandit rutrum. Nunc in tempus turpis.
        <br />
        <small><a>Like</a> · <a>Reply</a> · 3 hrs</small>
      </p>
    </div>

    <article class="media">
      <figure class="media-left">
        <p class="image is-48x48">
          <img src="https://bulma.io/assets/images/placeholders/96x96.png" />
        </p>
      </figure>
      <div class="media-content">
        <div class="content">
          <p>
            <strong>Sean Brown</strong>
            <br />
            Donec sollicitudin urna eget eros malesuada sagittis. Pellentesque
            habitant morbi tristique senectus et netus et malesuada fames ac
            turpis egestas. Aliquam blandit nisl a nulla sagittis, a lobortis
            leo feugiat.
            <br />
            <small><a>Like</a> · <a>Reply</a> · 2 hrs</small>
          </p>
        </div>

        <article class="media">
          Vivamus quis semper metus, non tincidunt dolor. Vivamus in mi eu lorem
          cursus ullamcorper sit amet nec massa.
        </article>

        <article class="media">
          Morbi vitae diam et purus tincidunt porttitor vel vitae augue.
          Praesent malesuada metus sed pharetra euismod. Cras tellus odio,
          tincidunt iaculis diam non, porta aliquet tortor.
        </article>
      </div>
    </article>

    <article class="media">
      <figure class="media-left">
        <p class="image is-48x48">
          <img src="https://bulma.io/assets/images/placeholders/96x96.png" />
        </p>
      </figure>
      <div class="media-content">
        <div class="content">
          <p>
            <strong>Kayli Eunice </strong>
            <br />
            Sed convallis scelerisque mauris, non pulvinar nunc mattis vel.
            Maecenas varius felis sit amet magna vestibulum euismod malesuada
            cursus libero. Vestibulum ante ipsum primis in faucibus orci luctus
            et ultrices posuere cubilia Curae; Phasellus lacinia non nisl id
            feugiat.
            <br />
            <small><a>Like</a> · <a>Reply</a> · 2 hrs</small>
          </p>
        </div>
      </div>
    </article>
  </div>
</article>

<article class="media">
  <figure class="media-left">
    <p class="image is-64x64">
      <img src="https://bulma.io/assets/images/placeholders/128x128.png" />
    </p>
  </figure>
  <div class="media-content">
    <div class="field">
      <p class="control">
        <textarea class="textarea" placeholder="Add a comment..."></textarea>
      </p>
    </div>
    <div class="field">
      <p class="control">
        <button class="button">Post comment</button>
      </p>
    </div>
  </div>
</article>

Sass and CSS variables
#
Sass Variable
	
CSS Variable
	
Value

$media-border-color

var(--bulma-media-border-color)

hsla(
  var(--bulma-scheme-h),
  var(--bulma-scheme-s),
  var(--bulma-border-l),
  0.5
)

$media-border-size

var(--bulma-media-border-size)

1px

$media-spacing

var(--bulma-media-spacing)

1rem

$media-spacing-large

var(--bulma-media-spacing-large)

1.5rem

$media-content-spacing

var(--bulma-media-content-spacing)

0.75rem

$media-level-1-spacing

var(--bulma-media-level-1-spacing)

0.75rem

$media-level-1-content-spacing

var(--bulma-media-level-1-content-spacing)

0.5rem

$media-level-2-spacing

var(--bulma-media-level-2-spacing)

0.5rem



Level

A multi-purpose horizontal level, which can contain almost any other element
CSS Masterclass

The structure of a level is the following:

    level: main container
        level-left for the left side
        level-right for the right side
            level-item for each individual element

In a level-item, you can then insert almost anything you want: a title, a button, a text input, or just simple text. No matter what elements you put inside a Bulma level, they will always be vertically centered.

Example

123 posts

All

Published

Drafts

Deleted

HTML

<!-- Main container -->
<nav class="level">
  <!-- Left side -->
  <div class="level-left">
    <div class="level-item">
      <p class="subtitle is-5"><strong>123</strong> posts</p>
    </div>
    <div class="level-item">
      <div class="field has-addons">
        <p class="control">
          <input class="input" type="text" placeholder="Find a post" />
        </p>
        <p class="control">
          <button class="button">Search</button>
        </p>
      </div>
    </div>
  </div>

  <!-- Right side -->
  <div class="level-right">
    <p class="level-item"><strong>All</strong></p>
    <p class="level-item"><a>Published</a></p>
    <p class="level-item"><a>Drafts</a></p>
    <p class="level-item"><a>Deleted</a></p>
    <p class="level-item"><a class="button is-success">New</a></p>
  </div>
</nav>

Centered level
#
If you want a centered level, you can use as many level-item as you want, as long as they are direct children of the level container.

Example

Tweets

3,456

Following

123

Followers

456K

Likes

789

HTML

<nav class="level">
  <div class="level-item has-text-centered">
    <div>
      <p class="heading">Tweets</p>
      <p class="title">3,456</p>
    </div>
  </div>
  <div class="level-item has-text-centered">
    <div>
      <p class="heading">Following</p>
      <p class="title">123</p>
    </div>
  </div>
  <div class="level-item has-text-centered">
    <div>
      <p class="heading">Followers</p>
      <p class="title">456K</p>
    </div>
  </div>
  <div class="level-item has-text-centered">
    <div>
      <p class="heading">Likes</p>
      <p class="title">789</p>
    </div>
  </div>
</nav>

Example

Home

Menu

Reservations

Contact

HTML

<nav class="level">
  <p class="level-item has-text-centered">
    <a class="link is-info">Home</a>
  </p>
  <p class="level-item has-text-centered">
    <a class="link is-info">Menu</a>
  </p>
  <p class="level-item has-text-centered">
    <img
      src="https://bulma.io/assets/images/bulma-type.png"
      alt=""
      style="height: 30px"
    />
  </p>
  <p class="level-item has-text-centered">
    <a class="link is-info">Reservations</a>
  </p>
  <p class="level-item has-text-centered">
    <a class="link is-info">Contact</a>
  </p>
</nav>

Mobile level
#
By default, for space concerns, the level is vertical on mobile. If you want the level to be horizontal on mobile as well, add the is-mobile modifier on the level container.

Example

Tweets

3,456

Following

123

Followers

456K

Likes

789

HTML

<nav class="level is-mobile">
  <div class="level-item has-text-centered">
    <div>
      <p class="heading">Tweets</p>
      <p class="title">3,456</p>
    </div>
  </div>
  <div class="level-item has-text-centered">
    <div>
      <p class="heading">Following</p>
      <p class="title">123</p>
    </div>
  </div>
  <div class="level-item has-text-centered">
    <div>
      <p class="heading">Followers</p>
      <p class="title">456K</p>
    </div>
  </div>
  <div class="level-item has-text-centered">
    <div>
      <p class="heading">Likes</p>
      <p class="title">789</p>
    </div>
  </div>
</nav>

Sass and CSS variables
#
Sass Variable
	
Value

$level-item-spacing

calc(var(--bulma-block-spacing) * 0.5)



Section

A simple container to divide your page into sections, like the one you’re currently reading
CSS Masterclass

The section components are simple layout elements with responsive padding. They are best used as direct children of body.

Example
Section
A simple container to divide your page into sections, like the one you're currently reading.

HTML

<section class="section">
  <h1 class="title">Section</h1>
  <h2 class="subtitle">
    A simple container to divide your page into <strong>sections</strong>, like
    the one you're currently reading.
  </h2>
</section>

Sizes
#

You can use the modifiers is-medium and is-large to change the spacing.

Example
Medium section
A simple container to divide your page into sections, like the one you're currently reading.

HTML

<section class="section is-medium">
  <h1 class="title">Medium section</h1>
  <h2 class="subtitle">
    A simple container to divide your page into <strong>sections</strong>, like
    the one you're currently reading.
  </h2>
</section>

Example
Large section
A simple container to divide your page into sections, like the one you're currently reading.

HTML

<section class="section is-large">
  <h1 class="title">Large section</h1>
  <h2 class="subtitle">
    A simple container to divide your page into <strong>sections</strong>, like
    the one you're currently reading.
  </h2>
</section>

Sass and CSS variables
#
Sass Variable
	
CSS Variable
	
Value

$section-padding

var(--bulma-section-padding)

3rem 1.5rem

$section-padding-desktop

var(--bulma-section-padding-desktop)

3rem 3rem

$section-padding-medium

var(--bulma-section-padding-medium)

9rem 4.5rem

$section-padding-large

var(--bulma-section-padding-large)

18rem 6rem



Hero

An imposing hero banner to showcase something
CSS Masterclass

The hero component allows you to add a full width banner to your webpage, which can optionally cover the full height of the page as well.

The basic requirement of this component are:

    hero as the main container
        hero-body as a direct child, in which you can put all your content

For the fullheight hero to work, you will also need a hero-head and a hero-foot.

Example

Hero title

Hero subtitle

HTML

<section class="hero">
  <div class="hero-body">
    <p class="title">Hero title</p>
    <p class="subtitle">Hero subtitle</p>
  </div>
</section>

Colors
#
As with buttons, you can choose one of the 8 different colors:

Example

Link hero

Link subtitle

HTML

<section class="hero is-link">
  <div class="hero-body">
    <p class="title">Link hero</p>
    <p class="subtitle">Link subtitle</p>
  </div>
</section>

Example

Primary hero

Primary subtitle

HTML

<section class="hero is-primary">
  <div class="hero-body">
    <p class="title">Primary hero</p>
    <p class="subtitle">Primary subtitle</p>
  </div>
</section>

Example

Info hero

Info subtitle

HTML

<section class="hero is-info">
  <div class="hero-body">
    <p class="title">Info hero</p>
    <p class="subtitle">Info subtitle</p>
  </div>
</section>

Example

Success hero

Success subtitle

HTML

<section class="hero is-success">
  <div class="hero-body">
    <p class="title">Success hero</p>
    <p class="subtitle">Success subtitle</p>
  </div>
</section>

Example

Warning hero

Warning subtitle

HTML

<section class="hero is-warning">
  <div class="hero-body">
    <p class="title">Warning hero</p>
    <p class="subtitle">Warning subtitle</p>
  </div>
</section>

Example

Danger hero

Danger subtitle

HTML

<section class="hero is-danger">
  <div class="hero-body">
    <p class="title">Danger hero</p>
    <p class="subtitle">Danger subtitle</p>
  </div>
</section>

Sizes
#

You can have even more imposing banners by using one of 5 different sizes:

    is-small
    is-medium
    is-large
    is-halfheight
    is-fullheight

Example

Small hero

Small subtitle

HTML

<section class="hero is-small is-primary">
  <div class="hero-body">
    <p class="title">Small hero</p>
    <p class="subtitle">Small subtitle</p>
  </div>
</section>

Example

Medium hero

Medium subtitle

HTML

<section class="hero is-medium is-link">
  <div class="hero-body">
    <p class="title">Medium hero</p>
    <p class="subtitle">Medium subtitle</p>
  </div>
</section>

Example

Large hero

Large subtitle

HTML

<section class="hero is-large is-info">
  <div class="hero-body">
    <p class="title">Large hero</p>
    <p class="subtitle">Large subtitle</p>
  </div>
</section>

Example

Half height hero

Half height subtitle

HTML

<section class="hero is-success is-halfheight">
  <div class="hero-body">
    <div class="">
      <p class="title">Half height hero</p>
      <p class="subtitle">Half height subtitle</p>
    </div>
  </div>
</section>

Example

Fullheight hero

Fullheight subtitle

HTML

<section class="hero is-danger is-fullheight">
  <div class="hero-body">
    <div class="">
      <p class="title">Fullheight hero</p>
      <p class="subtitle">Fullheight subtitle</p>
    </div>
  </div>
</section>

Fullheight with navbar
#

If you are using a fixed navbar, you can use the is-fullheight-with-navbar modifier on the hero for it to occupy the viewport height minus the navbar height.

Example
Home
Documentation

Fullheight hero with navbar

HTML

 <nav class="navbar">
  <div class="container">
    <div id="navMenu" class="navbar-menu">
      <div class="navbar-start">
        <a class="navbar-item">
          Home
        </a>
        <a class="navbar-item">
          Documentation
        </a>
      </div>

      <div class="navbar-end">
        <div class="navbar-item">
          <div class="buttons">
            <a class="button is-dark">Github</a>
            <a class="button is-link">Download</a>
          </div>
        </div>
      </div>
    </div>
  </div>
</nav>

<section class="hero is-link is-fullheight-with-navbar">
  <div class="hero-body">
    <p class="title">Fullheight hero with navbar</p>
  </div>
</section>

Fullheight hero in 3 parts
#

To obtain a hero that will cover the whole height of the viewport, you can split it in 3 vertical parts:

    hero
        hero-head (always at the top)
        hero-body (always vertically centered)
        hero-foot (always at the bottom)

Example
Logo
Home
Examples
Documentation

Title

Subtitle

HTML

<section class="hero is-primary is-medium">
  <!-- Hero head: will stick at the top -->
  <div class="hero-head">
    <nav class="navbar">
      <div class="container">
        <div class="navbar-brand">
          <a class="navbar-item">
            <img src="https://bulma.io/assets/images/bulma-type-white.png" alt="Logo" />
          </a>
          <span class="navbar-burger" data-target="navbarMenuHeroA">
            <span></span>
            <span></span>
            <span></span>
            <span></span>
          </span>
        </div>
        <div id="navbarMenuHeroA" class="navbar-menu">
          <div class="navbar-end">
            <a class="navbar-item is-active"> Home </a>
            <a class="navbar-item"> Examples </a>
            <a class="navbar-item"> Documentation </a>
            <span class="navbar-item">
              <a class="button is-primary is-inverted">
                <span class="icon">
                  <i class="fab fa-github"></i>
                </span>
                <span>Download</span>
              </a>
            </span>
          </div>
        </div>
      </div>
    </nav>
  </div>

  <!-- Hero content: will be in the middle -->
  <div class="hero-body">
    <div class="container has-text-centered">
      <p class="title">Title</p>
      <p class="subtitle">Subtitle</p>
    </div>
  </div>

  <!-- Hero footer: will stick at the bottom -->
  <div class="hero-foot">
    <nav class="tabs">
      <div class="container">
        <ul>
          <li class="is-active"><a>Overview</a></li>
          <li><a>Modifiers</a></li>
          <li><a>Grid</a></li>
          <li><a>Elements</a></li>
          <li><a>Components</a></li>
          <li><a>Layout</a></li>
        </ul>
      </div>
    </nav>
  </div>
</section>

Example
Logo
Home
Examples
Documentation

Title

Subtitle

HTML

<section class="hero is-info is-large">
  <div class="hero-head">
    <nav class="navbar">
      <div class="container">
        <div class="navbar-brand">
          <a class="navbar-item">
            <img src="https://bulma.io/assets/images/bulma-type-white.png" alt="Logo" />
          </a>
          <span class="navbar-burger" data-target="navbarMenuHeroB">
            <span></span>
            <span></span>
            <span></span>
            <span></span>
          </span>
        </div>
        <div id="navbarMenuHeroB" class="navbar-menu">
          <div class="navbar-end">
            <a class="navbar-item is-active"> Home </a>
            <a class="navbar-item"> Examples </a>
            <a class="navbar-item"> Documentation </a>
            <span class="navbar-item">
              <a class="button is-info is-inverted">
                <span class="icon">
                  <i class="fab fa-github"></i>
                </span>
                <span>Download</span>
              </a>
            </span>
          </div>
        </div>
      </div>
    </nav>
  </div>

  <div class="hero-body">
    <div class="container has-text-centered">
      <p class="title">Title</p>
      <p class="subtitle">Subtitle</p>
    </div>
  </div>

  <div class="hero-foot">
    <nav class="tabs is-boxed is-fullwidth">
      <div class="container">
        <ul>
          <li class="is-active">
            <a>Overview</a>
          </li>
          <li>
            <a>Modifiers</a>
          </li>
          <li>
            <a>Grid</a>
          </li>
          <li>
            <a>Elements</a>
          </li>
          <li>
            <a>Components</a>
          </li>
          <li>
            <a>Layout</a>
          </li>
        </ul>
      </div>
    </nav>
  </div>
</section>

Example
Logo
Home
Examples
Documentation

Title

Subtitle

HTML

<section class="hero is-success is-fullheight">
  <!-- Hero head: will stick at the top -->
  <div class="hero-head">
    <header class="navbar">
      <div class="container">
        <div class="navbar-brand">
          <a class="navbar-item">
            <img src="https://bulma.io/assets/images/bulma-type-white.png" alt="Logo" />
          </a>
          <span class="navbar-burger" data-target="navbarMenuHeroC">
            <span></span>
            <span></span>
            <span></span>
            <span></span>
          </span>
        </div>
        <div id="navbarMenuHeroC" class="navbar-menu">
          <div class="navbar-end">
            <a class="navbar-item is-active"> Home </a>
            <a class="navbar-item"> Examples </a>
            <a class="navbar-item"> Documentation </a>
            <span class="navbar-item">
              <a class="button is-success is-inverted">
                <span class="icon">
                  <i class="fab fa-github"></i>
                </span>
                <span>Download</span>
              </a>
            </span>
          </div>
        </div>
      </div>
    </header>
  </div>

  <!-- Hero content: will be in the middle -->
  <div class="hero-body">
    <div class="container has-text-centered">
      <p class="title">Title</p>
      <p class="subtitle">Subtitle</p>
    </div>
  </div>

  <!-- Hero footer: will stick at the bottom -->
  <div class="hero-foot">
    <nav class="tabs is-boxed is-fullwidth">
      <div class="container">
        <ul>
          <li class="is-active"><a>Overview</a></li>
          <li><a>Modifiers</a></li>
          <li><a>Grid</a></li>
          <li><a>Elements</a></li>
          <li><a>Components</a></li>
          <li><a>Layout</a></li>
        </ul>
      </div>
    </nav>
  </div>
</section>

Sass and CSS variables
#
Sass Variable
	
CSS Variable
	
Value

$hero-body-padding

var(--bulma-hero-body-padding)

3rem 1.5rem

$hero-body-padding-tablet

var(--bulma-hero-body-padding-tablet)

3rem 3rem

$hero-body-padding-small

var(--bulma-hero-body-padding-small)

1.5rem

$hero-body-padding-medium

var(--bulma-hero-body-padding-medium)

9rem 4.5rem

$hero-body-padding-large

var(--bulma-hero-body-padding-large)

18rem 6rem

$hero-gradient-h-offset

var(--bulma-hero-gradient-h-offset)

5deg

$hero-gradient-s-offset

var(--bulma-hero-gradient-s-offset)

10%

$hero-gradient-l-offset

var(--bulma-hero-gradient-l-offset:)

5%



Container

A simple container to center your content horizontally
CSS Masterclass

The container is a simple utility element that allows you to center content on larger viewports. It can be used in any context, but mostly as a direct child of one of the following:

    navbar
    hero
    section
    footer

Overview
#
	Below
1023px 	Desktop
Between 1024px and 1215px 	Widescreen
Between 1216px and 1407px 	FullHD
1408px and above
Class 	max-width
.container 	Full width 	960px 	1152px 	1344px
.container.is-widescreen 	Full width 	1152px 	1344px
.container.is-fullhd 	Full width 	1344px
.container.is-max-desktop 	Full width 	960px
.container.is-max-widescreen 	Full width 	960px 	1152px
Default behavior
#

By default, the container will only be activated from the $desktop breakpoint. It will increase its max-width after reaching the $widescreen and $fullhd breakpoints.

The container's width for each breakpoint is the result of: $device - (2 * $gap). The $gap variable has a default value of 32px but can be modified.

This is how the container will behave:

    on $desktop it will have a maximum width of 960px.
    on $widescreen it will have a maximum width of 1152px.
    on $fullhd it will have a maximum width of 1344px.

The values 960, 1152 and 1344 have been chosen because they are divisible by both 12 and 16.
This container is centered on desktop and larger viewports.

<div class="container">
  <div class="notification is-primary">
    This container is <strong>centered</strong> on desktop and larger viewports.
  </div>
</div>

Widescreen or FullHD only
#

With the two modifiers is-widescreen and is-fullhd, you can have a fullwidth container until those specific breakpoints.
This container is fullwidth until the $widescreen breakpoint.

<div class="container is-widescreen">
  <div class="notification is-primary">
    This container is <strong>fullwidth</strong> <em>until</em> the
    <code>$widescreen</code> breakpoint.
  </div>
</div>

This container is fullwidth until the $fullhd breakpoint.

<div class="container is-fullhd">
  <div class="notification is-primary">
    This container is <strong>fullwidth</strong> <em>until</em> the
    <code>$fullhd</code> breakpoint.
  </div>
</div>

Tablet, Desktop and Widescreen maximum widths
#

Sometimes, you might want a narrow container on larger viewports. That's why Bulma provides 3 modifier classes:

    .container.is-max-tablet will behave like a tablet container
    .container.is-max-desktop will behave like a desktop container
    .container.is-max-widescreen will behave like a widescreen container

This container has a max-width of $tablet - $container-offset.

<div class="container is-max-tablet">
  <div class="notification is-primary">
    This container has a <code>max-width</code> of
    <code>$tablet - $container-offset</code>.
  </div>
</div>

This container has a max-width of $desktop - $container-offset on widescreen and fullhd.

<div class="container is-max-desktop">
  <div class="notification is-primary">
    This container has a <code>max-width</code> of
    <code>$desktop - $container-offset</code> on widescreen and fullhd.
  </div>
</div>

This container has a max-width of $widescreen - $container-offset on fullhd.

<div class="container is-max-widescreen">
  <div class="notification is-primary">
    This container has a <code>max-width</code> of
    <code>$widescreen - $container-offset</code> on fullhd.
  </div>
</div>

Absolute maximum width
#

If you want to change the maximum width of all containers, you can do so by updating the values of the $container-max-width Sass variable.

By default, the $fullhd breakpoint value is used to calculate the absolute maximum width of the container. Simply change it to a smaller value like $widescreen, $desktop, or any value in pixels.
Fluid container
#

If you don't want to have a maximum width but want to keep the 32px margin on the left and right sides, add the is-fluid modifier:
This container is fluid: it will have a 32px gap on either side, on any viewport size.

<div class="container is-fluid">
  <div class="notification is-primary">
    This container is <strong>fluid</strong>: it will have a 32px gap on either
    side, on any viewport size.
  </div>
</div>

Sass and CSS variables
#
Sass Variable
	
Value

$container-offset

64px

$container-max-width

1408px



Bulma Grid Playground

Try out the Bulma 2D Grid
CSS Masterclass
Smart Grid
#
You can use this example to try out the Smart Grid with different column widths and different gap values.
HTML <div class="grid">
Cell 1
Cell 2
Cell 3
Cell 4
Cell 5
Cell 6
Cell 7
Cell 8
Cell 9
Cell 10
Cell 11
Cell 12
Cell 13
Cell 14
Cell 15
Cell 16
Cell 17
Cell 18
Cell 19
Cell 20
Cell 21
Cell 22
Cell 23
Cell 24
Fixed Grid
#
You can use these controls to try out the Fixed Grid with different columns counts.
HTML <div class="fixed-grid">
Use the handle on the right side to change the container's width: 1455px
Cell 1
Cell 2
Cell 3
Cell 4
Cell 5
Cell 6
Cell 7
Cell 8
Cell 9
Cell 10
Cell 11
Cell 12
Cell 13
Cell 14
Cell 15
Cell 16
Cell 17
Cell 18
Cell 19
Cell 20
Cell 21
Cell 22
Cell 23
Cell 24
Space intentionally left blank to prevent layout jumps

Grid Cells

Adjust the width and height of each individual cell
CSS Masterclass

Each Bulma grid is comprised of several cells. You can adjust the width and height of each of these cells individually, and for each separate breakpoint.
Description 	Class 	Example
Which column the cell starts at 	is-col-start 	

<div class="is-col-start-2"></div>

Which column the cell ends at, counting from the end 	is-col-from-end 	

<div class="is-col-from-end-1"></div>

How many columns the cell will span 	is-col-span 	

<div class="is-col-span-3"></div>

Which row the cell starts at 	is-row-start 	

<div class="is-row-start-2"></div>

Which row the cell ends at, counting from the end 	is-row-from-end 	

<div class="is-row-from-end-1"></div>

How many rows the cell will span 	is-row-span 	

<div class="is-row-span-3"></div>

Column Start
#

Change which column a cell starts at.
Cell 1
Cell 2
Cell 3
Cell 4
Cell 5
Cell 6

HTML

<div class="fixed-grid has-4-cols">
  <div class="grid">
    <div class="cell">Cell 1</div>
    <div class="cell is-col-start-3">Cell 2</div>
    <div class="cell">Cell 3</div>
    <div class="cell">Cell 4</div>
    <div class="cell">Cell 5</div>
    <div class="cell">Cell 6</div>
  </div>
</div>

Column From End
#

Change which column a cell ends at, counting from the end.
Cell 1
Cell 2
Cell 3
Cell 4
Cell 5
Cell 6

HTML

<div class="fixed-grid has-4-cols">
  <div class="grid">
    <div class="cell">Cell 1</div>
    <div class="cell is-col-from-end-2">Cell 2</div>
    <div class="cell">Cell 3</div>
    <div class="cell">Cell 4</div>
    <div class="cell">Cell 5</div>
    <div class="cell">Cell 6</div>
  </div>
</div>

Column Span
#

Change how many columns a cell spans.
Cell 1
Cell 2
Cell 3
Cell 4
Cell 5
Cell 6

HTML

<div class="fixed-grid has-4-cols">
  <div class="grid">
    <div class="cell">Cell 1</div>
    <div class="cell is-col-span-2">Cell 2</div>
    <div class="cell">Cell 3</div>
    <div class="cell">Cell 4</div>
    <div class="cell">Cell 5</div>
    <div class="cell">Cell 6</div>
  </div>
</div>

Row Start
#

Change which row a cell starts at.
Cell 1
Cell 2
Cell 3
Cell 4
Cell 5
Cell 6

HTML

<div class="fixed-grid has-4-cols">
  <div class="grid">
    <div class="cell">Cell 1</div>
    <div class="cell is-row-start-3">Cell 2</div>
    <div class="cell">Cell 3</div>
    <div class="cell">Cell 4</div>
    <div class="cell">Cell 5</div>
    <div class="cell">Cell 6</div>
  </div>
</div>

Row From End
#

Change which row a cell ends at, counting from the end.
Cell 1
Cell 2
Cell 3
Cell 4
Cell 5
Cell 6

HTML

<div class="fixed-grid has-4-cols">
  <div class="grid">
    <div class="cell">Cell 1</div>
    <div class="cell is-row-from-end-1">Cell 2</div>
    <div class="cell">Cell 3</div>
    <div class="cell">Cell 4</div>
    <div class="cell">Cell 5</div>
    <div class="cell">Cell 6</div>
  </div>
</div>

Row Span
#

Change how many rows a cell spans.
Cell 1
Cell 2
Cell 3
Cell 4
Cell 5
Cell 6

HTML

<div class="fixed-grid has-4-cols">
  <div class="grid">
    <div class="cell">Cell 1</div>
    <div class="cell is-row-span-2">Cell 2</div>
    <div class="cell">Cell 3</div>
    <div class="cell">Cell 4</div>
    <div class="cell">Cell 5</div>
    <div class="cell">Cell 6</div>
  </div>
</div>



Fixed Grid

A customizable 2D fixed grid
CSS Masterclass

If instead of having a minimum column width you want a fixed number of columns, wrap your grid in a fixed-grid container.

By default, this fixed grid has 2 columns:
Cell 1
Cell 2
Cell 3
Cell 4
Cell 5
Cell 6
Cell 7
Cell 8
Cell 9
Cell 10
Cell 11
Cell 12

HTML

<div class="fixed-grid">
  <div class="grid">
    <div class="cell">Cell 1</div>
    <div class="cell">Cell 2</div>
    <div class="cell">Cell 3</div>
    <div class="cell">Cell 4</div>
    <div class="cell">Cell 5</div>
    <div class="cell">Cell 6</div>
    <div class="cell">Cell 7</div>
    <div class="cell">Cell 8</div>
    <div class="cell">Cell 9</div>
    <div class="cell">Cell 10</div>
    <div class="cell">Cell 11</div>
    <div class="cell">Cell 12</div>
  </div>
</div>

Applying fixed grid modifiers
#

You can change the column count by adding the has-$n-cols modifier class with a value ranging from 1 to 12:
Class 	Column Count
has-0-cols 	0
has-1-cols 	1
has-2-cols 	2
has-3-cols 	3
has-4-cols 	4
has-5-cols 	5
has-6-cols 	6
has-7-cols 	7
has-8-cols 	8
has-9-cols 	9
has-10-cols 	10
has-11-cols 	11
has-12-cols 	12
Container breakpoints
#

You can specify a different column count per breakpoint:
Column Count 	Mobile 	Tablet 	Desktop 	Widescreen 	Full HD
Until 768px 	From 769px 	From 1024px 	From 1216px 	From 1408px
1 	has-1-cols-mobile 	has-1-cols-tablet 	has-1-cols-desktop 	has-1-cols-widescreen 	has-1-cols-fullhd
2 	has-2-cols-mobile 	has-2-cols-tablet 	has-2-cols-desktop 	has-2-cols-widescreen 	has-2-cols-fullhd
3 	has-3-cols-mobile 	has-3-cols-tablet 	has-3-cols-desktop 	has-3-cols-widescreen 	has-3-cols-fullhd
4 	has-4-cols-mobile 	has-4-cols-tablet 	has-4-cols-desktop 	has-4-cols-widescreen 	has-4-cols-fullhd
5 	has-5-cols-mobile 	has-5-cols-tablet 	has-5-cols-desktop 	has-5-cols-widescreen 	has-5-cols-fullhd
6 	has-6-cols-mobile 	has-6-cols-tablet 	has-6-cols-desktop 	has-6-cols-widescreen 	has-6-cols-fullhd
7 	has-7-cols-mobile 	has-7-cols-tablet 	has-7-cols-desktop 	has-7-cols-widescreen 	has-7-cols-fullhd
8 	has-8-cols-mobile 	has-8-cols-tablet 	has-8-cols-desktop 	has-8-cols-widescreen 	has-8-cols-fullhd
9 	has-9-cols-mobile 	has-9-cols-tablet 	has-9-cols-desktop 	has-9-cols-widescreen 	has-9-cols-fullhd
10 	has-10-cols-mobile 	has-10-cols-tablet 	has-10-cols-desktop 	has-10-cols-widescreen 	has-10-cols-fullhd
11 	has-11-cols-mobile 	has-11-cols-tablet 	has-11-cols-desktop 	has-11-cols-widescreen 	has-11-cols-fullhd
12 	has-12-cols-mobile 	has-12-cols-tablet 	has-12-cols-desktop 	has-12-cols-widescreen 	has-12-cols-fullhd
Auto Count Fixed Grid
#

By adding the has-auto-count modifier, the fixed grid will automatically change its count for each breakpoint:

    2 on mobile
    4 on tablet
    8 on desktop
    12 on widescreen
    16 on fullhd

Cell 1
Cell 2
Cell 3
Cell 4
Cell 5
Cell 6
Cell 7
Cell 8
Cell 9
Cell 10
Cell 11
Cell 12
Cell 13
Cell 14
Cell 15
Cell 16

HTML

<div class="fixed-grid has-auto-count">
  <div class="grid">
    <div class="cell">Cell 1</div>
    <div class="cell">Cell 2</div>
    <div class="cell">Cell 3</div>
    <div class="cell">Cell 4</div>
    <div class="cell">Cell 5</div>
    <div class="cell">Cell 6</div>
    <div class="cell">Cell 7</div>
    <div class="cell">Cell 8</div>
    <div class="cell">Cell 9</div>
    <div class="cell">Cell 10</div>
    <div class="cell">Cell 11</div>
    <div class="cell">Cell 12</div>

    

Smart Grid

A smart 2D grid with flexible columns
CSS Masterclass

Bulma v1 comes with a new Smart Grid. This grid is a 2 dimensional layout component that features flexible columns: Bulma will fit as many columns as possible, given a minimum column width and a column and row gap.

By default, the Smart Grid has:

    a minimum column width of 9rem
    a gap of 0.75rem

Cell 1
Cell 2
Cell 3
Cell 4
Cell 5
Cell 6
Cell 7
Cell 8
Cell 9
Cell 10
Cell 11
Cell 12
Cell 13
Cell 14
Cell 15
Cell 16
Cell 17
Cell 18
Cell 19
Cell 20
Cell 21
Cell 22
Cell 23
Cell 24

HTML

<div class="grid">
  <div class="cell">Cell 1</div>
  <div class="cell">Cell 2</div>
  <div class="cell">Cell 3</div>
  <div class="cell">Cell 4</div>
  <div class="cell">Cell 5</div>
  <div class="cell">Cell 6</div>
  <div class="cell">Cell 7</div>
  <div class="cell">Cell 8</div>
  <div class="cell">Cell 9</div>
  <div class="cell">Cell 10</div>
  <div class="cell">Cell 11</div>
  <div class="cell">Cell 12</div>
  <div class="cell">Cell 13</div>
  <div class="cell">Cell 14</div>
  <div class="cell">Cell 15</div>
  <div class="cell">Cell 16</div>
  <div class="cell">Cell 17</div>
  <div class="cell">Cell 18</div>
  <div class="cell">Cell 19</div>
  <div class="cell">Cell 20</div>
  <div class="cell">Cell 21</div>
  <div class="cell">Cell 22</div>
  <div class="cell">Cell 23</div>
  <div class="cell">Cell 24</div>
</div>

Smart Grid modifiers
#

You can change the minimum column width by increments of 1.5rem, by adding the is-col-min modifier class with a value ranging from 0 to 32:
Class 	Value
is-col-min-1 	1.5rem
is-col-min-2 	3.0rem
is-col-min-3 	4.5rem
is-col-min-4 	6.0rem
is-col-min-5 	7.5rem
is-col-min-6 	9.0rem
is-col-min-7 	10.5rem
is-col-min-8 	12.0rem
is-col-min-9 	13.5rem
is-col-min-10 	15.0rem
is-col-min-11 	16.5rem
is-col-min-12 	18.0rem
is-col-min-13 	19.5rem
is-col-min-14 	21.0rem
is-col-min-15 	22.5rem
is-col-min-16 	24.0rem
is-col-min-17 	25.5rem
is-col-min-18 	27.0rem
is-col-min-19 	28.5rem
is-col-min-20 	30.0rem
is-col-min-21 	31.5rem
is-col-min-22 	33.0rem
is-col-min-23 	34.5rem
is-col-min-24 	36.0rem
is-col-min-25 	37.5rem
is-col-min-26 	39.0rem
is-col-min-27 	40.5rem
is-col-min-28 	42.0rem
is-col-min-29 	43.5rem
is-col-min-30 	45.0rem
is-col-min-31 	46.5rem
is-col-min-32 	48.0rem

You can also change the gap, column-gap and/or row-gap by increments of 0.5rem:
Gap Class 	Column Gap 	Row Gap 	Value
is-gap-0 	is-column-gap-0 	is-row-gap-0 	0.0rem
is-gap-1 	is-column-gap-1 	is-row-gap-1 	0.5rem
is-gap-2 	is-column-gap-2 	is-row-gap-2 	1.0rem
is-gap-3 	is-column-gap-3 	is-row-gap-3 	1.5rem
is-gap-4 	is-column-gap-4 	is-row-gap-4 	2.0rem
is-gap-5 	is-column-gap-5 	is-row-gap-5 	2.5rem
is-gap-6 	is-column-gap-6 	is-row-gap-6 	3.0rem
is-gap-7 	is-column-gap-7 	is-row-gap-7 	3.5rem
is-gap-8 	is-column-gap-8 	is-row-gap-8 	4.0rem



Column options

Design different types of column layouts
CSS Masterclass
Vertical alignment
#

To align your columns vertically, add the is-vcentered modifier to the columns container.

First column

Second column with more content. This is so you can see the vertical alignment.

<div class="columns is-vcentered">
  <div class="column is-8">
    <p class="bd-notification is-primary">First column</p>
  </div>
  <div class="column">
    <p class="bd-notification is-primary">
      Second column with more content. This is so you can see the vertical
      alignment.
    </p>
  </div>
</div>

Multiline
#

Whenever you want to start a new line, you can close a columns container and start a new one. But you can also add the is-multiline modifier and add more column elements than would fit in a single row.

is-one-quarter

is-one-quarter

is-one-quarter

is-one-quarter

is-half

is-one-quarter

is-one-quarter

is-one-quarter

Auto

<div class="columns is-multiline is-mobile">
  <div class="column is-one-quarter">
    <code>is-one-quarter</code>
  </div>
  <div class="column is-one-quarter">
    <code>is-one-quarter</code>
  </div>
  <div class="column is-one-quarter">
    <code>is-one-quarter</code>
  </div>
  <div class="column is-one-quarter">
    <code>is-one-quarter</code>
  </div>
  <div class="column is-half">
    <code>is-half</code>
  </div>
  <div class="column is-one-quarter">
    <code>is-one-quarter</code>
  </div>
  <div class="column is-one-quarter">
    <code>is-one-quarter</code>
  </div>
  <div class="column is-one-quarter">
    <code>is-one-quarter</code>
  </div>
  <div class="column">Auto</div>
</div>

Centering columns
#

While you can use empty columns (like <div class="column"></div>) to create horizontal space around .column elements, you can also use .is-centered on the parent .columns element:

is-half

<div class="columns is-mobile is-centered">
  <div class="column is-half">
    <p class="bd-notification is-primary">
      <code class="html">is-half</code><br />
    </p>
  </div>
</div>

Use with .is-multiline to create a flexible, centered list (try resizing to see centering in different viewport sizes):

is-narrow
First Column

is-narrow
Our Second Column

is-narrow
Third Column

is-narrow
The Fourth Column

is-narrow
Fifth Column

<div class="columns is-mobile is-multiline is-centered">
  <div class="column is-narrow">
    <p class="bd-notification is-primary">
      <code class="html">is-narrow</code><br />
      First Column
    </p>
  </div>
  <div class="column is-narrow">
    <p class="bd-notification is-primary">
      <code class="html">is-narrow</code><br />
      Our Second Column
    </p>
  </div>
  <div class="column is-narrow">
    <p class="bd-notification is-primary">
      <code class="html">is-narrow</code><br />
      Third Column
    </p>
  </div>
  <div class="column is-narrow">
    <p class="bd-notification is-primary">
      <code class="html">is-narrow</code><br />
      The Fourth Column
    </p>
  </div>
  <div class="column is-narrow">
    <p class="bd-notification is-primary">
      <code class="html">is-narrow</code><br />
      Fifth Column
    </p>
  </div>
</div>



Columns gap

Customize the gap between the columns
CSS Masterclass
Default gap
#

Each column has a gap equal to the variable $column-gap, which has a default value of 0.75rem.
Since the gap is on each side of a column, the gap between two adjacent columns will be twice the value of $column-gap, or 1.5rem by default.

Default gap

Default gap

Default gap

Default gap
Gapless
#

If you want to remove the space between the columns, add the is-gapless modifier on the columns container:

First column

Second column

Third column

Fourth column

<div class="columns is-gapless">
  <div class="column">No gap</div>
  <div class="column">No gap</div>
  <div class="column">No gap</div>
  <div class="column">No gap</div>
</div>

You can combine it with the is-multiline modifier:

is-one-quarter

is-one-quarter

is-one-quarter

is-one-quarter

is-half

is-one-quarter

is-one-quarter

is-one-quarter

Auto

<div class="columns is-gapless is-multiline is-mobile">
  <div class="column is-one-quarter">is-one-quarter</div>
  <div class="column is-one-quarter">is-one-quarter</div>
  <div class="column is-one-quarter">is-one-quarter</div>
  <div class="column is-one-quarter">is-one-quarter</div>
  <div class="column is-half">is-half</div>
  <div class="column is-one-quarter">is-one-quarter</div>
  <div class="column is-one-quarter">is-one-quarter</div>
  <div class="column is-one-quarter">is-one-quarter</div>
  <div class="column">Auto</div>
</div>

Variable gap
#

You can specify a custom column gap by appending one of 9 modifiers on the .columns container.

    is-0 will remove any gap (similar to is-gapless)
    is-3 is the default value, equivalent to the 0.75rem value
    is-8 is the maximum gap of 2rem

<div class="columns is-8">
  <div class="column">Column</div>
  <div class="column">Column</div>
  <div class="column">Column</div>
  <div class="column">Column</div>
</div>

Gap: 0.75rem
is-0
is-1
is-2
is-3
is-4
is-5
is-6
is-7
is-8
Side
Main
Three columns
Three columns
Three columns
1
2
3
4
5
6
7
8
9
10
11
12
Breakpoint based column gaps
#

You can define a column gap for each viewport size:

For example, here's how it looks with the following modifiers: is-2-mobile is-0-tablet is-3-desktop is-8-widescreen is-1-fullhd

<div class="columns is-1-mobile is-0-tablet is-3-desktop is-8-widescreen is-2-fullhd">
  <div class="column">Column</div>
  <div class="column">Column</div>
  <div class="column">Column</div>
  <div class="column">Column</div>
  <div class="column">Column</div>
  <div class="column">Column</div>
</div>

Column

Column

Column

Column

Column

Column

If you want to see the difference, resize your browser and see how the columns gap varies.



Columns responsiveness

Handle different column layouts for each breakpoint
CSS Masterclass
Mobile columns
#

By default, columns are only activated from tablet onwards. This means columns are stacked on top of each other on mobile.
If you want columns to work on mobile too, just add the is-mobile modifier on the columns container:

1

2

3

4

<div class="columns is-mobile">
  <div class="column">1</div>
  <div class="column">2</div>
  <div class="column">3</div>
  <div class="column">4</div>
</div>

Resize

If you want to see the difference, resize your browser and see when the columns are stacked and when they are horizontally distributed.

If you only want columns on desktop upwards, just use the is-desktop modifier on the columns container:

1

2

3

4

<div class="columns is-desktop">
  <div class="column">1</div>
  <div class="column">2</div>
  <div class="column">3</div>
  <div class="column">4</div>
</div>

Different column sizes per breakpoint
#

You can define a column size for each viewport size: mobile, tablet, and desktop.

is-three-quarters-mobile
is-two-thirds-tablet
is-half-desktop
is-one-third-widescreen
is-one-quarter-fullhd

2

3

4

5

Resize

If you want to see these classes in action, resize your browser window and see how the same column varies in width at each breakpoint.

<div class="columns is-mobile">
  <div
    class="
      column
      is-three-quarters-mobile
      is-two-thirds-tablet
      is-half-desktop
      is-one-third-widescreen
      is-one-quarter-fullhd
    "
  >
    <code>is-three-quarters-mobile</code><br />
    <code>is-two-thirds-tablet</code><br />
    <code>is-half-desktop</code><br />
    <code>is-one-third-widescreen</code><br />
    <code>is-one-quarter-fullhd</code>
  </div>
  <div class="column">2</div>
  <div class="column">3</div>
  <div class="column">4</div>
  <div class="column">5</div>
</div>




Column sizes

Define the size of each column individually
CSS Masterclass

If you want to change the size of a single column, you can use one of the following classes:

    is-three-quarters
    is-two-thirds
    is-half
    is-one-third
    is-one-quarter
    is-full

The other columns will fill up the remaining space automatically.

You can now use the following multiples of 20% as well:

    is-four-fifths
    is-three-fifths
    is-two-fifths
    is-one-fifth

is-full

is-four-fifths

Auto

Auto

is-three-quarters

Auto

Auto

is-two-thirds

Auto

Auto

is-three-fifths

Auto

Auto

is-half

Auto

Auto

is-two-fifths

Auto

Auto

is-one-third

Auto

Auto

is-one-quarter

Auto

Auto

is-one-fifth

Auto

Auto

<div class="columns">
  <div class="column is-four-fifths">is-four-fifths</div>
  <div class="column">Auto</div>
  <div class="column">Auto</div>
</div>

<div class="columns">
  <div class="column is-three-quarters">is-three-quarters</div>
  <div class="column">Auto</div>
  <div class="column">Auto</div>
</div>

<div class="columns">
  <div class="column is-two-thirds">is-two-thirds</div>
  <div class="column">Auto</div>
  <div class="column">Auto</div>
</div>

<div class="columns">
  <div class="column is-three-fifths">is-three-fifths</div>
  <div class="column">Auto</div>
  <div class="column">Auto</div>
</div>

<div class="columns">
  <div class="column is-half">is-half</div>
  <div class="column">Auto</div>
  <div class="column">Auto</div>
</div>

<div class="columns">
  <div class="column is-two-fifths">is-two-fifths</div>
  <div class="column">Auto</div>
  <div class="column">Auto</div>
</div>

<div class="columns">
  <div class="column is-one-third">is-one-third</div>
  <div class="column">Auto</div>
  <div class="column">Auto</div>
</div>

<div class="columns">
  <div class="column is-one-quarter">is-one-quarter</div>
  <div class="column">Auto</div>
  <div class="column">Auto</div>
</div>

<div class="columns">
  <div class="column is-one-fifth">is-one-fifth</div>
  <div class="column">Auto</div>
  <div class="column">Auto</div>
</div>

12 columns system
#

As the grid can be divided into 12 columns, there are size classes for each division:

    is-1
    is-2
    is-3
    is-4
    is-5
    is-6
    is-7
    is-8
    is-9
    is-10
    is-11
    is-12

Naming convention

Each modifier class is named after how many columns you want out of 12. So if you want 7 columns out of 12, use is-7.

is-1

1

1

1

1

1

1

1

1

1

1

1

is-2

1

1

1

1

1

1

1

1

1

1

is-3

1

1

1

1

1

1

1

1

1

is-4

1

1

1

1

1

1

1

1

is-5

1

1

1

1

1

1

1

is-6

1

1

1

1

1

1

is-7

1

1

1

1

1

is-8

1

1

1

1

is-9

1

1

1

is-10

1

1

is-11

1

is-12
Offset
#

While you can use empty columns (like <div class="column"></div>) to create horizontal space around .column elements, you can also use offset modifiers like .is-offset-x:

is-half
is-offset-one-quarter

is-three-fifths
is-offset-one-fifth

is-4
is-offset-8

is-11
is-offset-1

<div class="columns is-mobile">
  <div class="column is-half is-offset-one-quarter"></div>
</div>

<div class="columns is-mobile">
  <div class="column is-three-fifths is-offset-one-fifth"></div>
</div>

<div class="columns is-mobile">
  <div class="column is-4 is-offset-8"></div>
</div>

<div class="columns is-mobile">
  <div class="column is-11 is-offset-1"></div>
</div>

Narrow column
#

If you want a column to only take the space it needs, use the is-narrow modifier. The other column(s) will fill up the remaining space.

Narrow column

This column is only 200px wide.

Flexible column

This column will take up the remaining space available.

<div class="columns">
  <div class="column is-narrow">
    <div class="box" style="width: 200px">
      <p class="title is-5">Narrow column</p>
      <p class="subtitle">This column is only 200px wide.</p>
    </div>
  </div>
  <div class="column">
    <div class="box">
      <p class="title is-5">Flexible column</p>
      <p class="subtitle">
        This column will take up the remaining space available.
      </p>
    </div>
  </div>
</div>

As for the size modifiers, you can have narrow columns for different breakpoints:

    .is-narrow-mobile
    .is-narrow-tablet
    .is-narrow-touch
    .is-narrow-desktop
    .is-narrow-widescreen
    .is-narrow-fullhd



Columns powered by Flexbox

A simple way to build responsive columns
CSS Masterclass

Building a columns layout with Bulma is very simple:

    Add a columns container
    Add as many column elements as you want

Each column will have an equal width, no matter the number of columns.

First column

Second column

Third column

Fourth column

<div class="columns">
  <div class="column">First column</div>
  <div class="column">Second column</div>
  <div class="column">Third column</div>
  <div class="column">Fourth column</div>
</div>



File upload

A custom file upload input, without JavaScript
CSS Masterclass

The file element is a simple interactive label that wraps an <input type="file">. It comprises several sub-elements:

    file the main container
        file-label the actual interactive and clickable part of the element
            file-input the native file input, hidden for styling purposes
            file-cta the upload call-to-action
                file-icon an optional upload icon
                file-label the "Choose a file…" text
            file-name a container for the chosen file name

Example

HTML

<div class="file">
  <label class="file-label">
    <input class="file-input" type="file" name="resume" />
    <span class="file-cta">
      <span class="file-icon">
        <i class="fas fa-upload"></i>
      </span>
      <span class="file-label"> Choose a file… </span>
    </span>
  </label>
</div>

Modifiers
#

With the has-name modifier combined with the file-name element, you can add a placeholder for the selected file name.

<div class="file has-name">
  <label class="file-label">
    <input class="file-input" type="file" name="resume" />
    <span class="file-cta">
      <span class="file-icon">
        <i class="fas fa-upload"></i>
      </span>
      <span class="file-label"> Choose a file… </span>
    </span>
    <span class="file-name"> Screen Shot 2017-07-29 at 15.54.25.png </span>
  </label>
</div>

You can move the CTA to the right side with the is-right modifier.

<div class="file has-name is-right">
  <label class="file-label">
    <input class="file-input" type="file" name="resume" />
    <span class="file-cta">
      <span class="file-icon">
        <i class="fas fa-upload"></i>
      </span>
      <span class="file-label"> Choose a file… </span>
    </span>
    <span class="file-name"> Screen Shot 2017-07-29 at 15.54.25.png </span>
  </label>
</div>

You can also expand the name to fill up the space with the is-fullwidth modifier.

<div class="file has-name is-fullwidth">
  <label class="file-label">
    <input class="file-input" type="file" name="resume" />
    <span class="file-cta">
      <span class="file-icon">
        <i class="fas fa-upload"></i>
      </span>
      <span class="file-label"> Choose a file… </span>
    </span>
    <span class="file-name"> Screen Shot 2017-07-29 at 15.54.25.png </span>
  </label>
</div>

You can have a boxed block with the is-boxed modifier.

<div class="file is-boxed">
  <label class="file-label">
    <input class="file-input" type="file" name="resume" />
    <span class="file-cta">
      <span class="file-icon">
        <i class="fas fa-upload"></i>
      </span>
      <span class="file-label"> Choose a file… </span>
    </span>
  </label>
</div>

You can combine has-name and is-boxed.

<div class="file has-name is-boxed">
  <label class="file-label">
    <input class="file-input" type="file" name="resume" />
    <span class="file-cta">
      <span class="file-icon">
        <i class="fas fa-upload"></i>
      </span>
      <span class="file-label"> Choose a file… </span>
    </span>
    <span class="file-name"> Screen Shot 2017-07-29 at 15.54.25.png </span>
  </label>
</div>

Colors
#

You can style the file element by appending one of the 0 color modifiers:

Example

HTML

<div class="file is-primary">
  <label class="file-label">
    <input class="file-input" type="file" name="resume" />
    <span class="file-cta">
      <span class="file-icon">
        <i class="fas fa-upload"></i>
      </span>
      <span class="file-label"> Primary file… </span>
    </span>
  </label>
</div>

Example

HTML

<div class="file is-info has-name">
  <label class="file-label">
    <input class="file-input" type="file" name="resume" />
    <span class="file-cta">
      <span class="file-icon">
        <i class="fas fa-upload"></i>
      </span>
      <span class="file-label"> Info file… </span>
    </span>
    <span class="file-name"> Screen Shot 2017-07-29 at 15.54.25.png </span>
  </label>
</div>

Example

HTML

<div class="file is-warning is-boxed">
  <label class="file-label">
    <input class="file-input" type="file" name="resume" />
    <span class="file-cta">
      <span class="file-icon">
        <i class="fas fa-cloud-upload-alt"></i>
      </span>
      <span class="file-label"> Warning file… </span>
    </span>
  </label>
</div>

Example

HTML

<div class="file is-danger has-name is-boxed">
  <label class="file-label">
    <input class="file-input" type="file" name="resume" />
    <span class="file-cta">
      <span class="file-icon">
        <i class="fas fa-cloud-upload-alt"></i>
      </span>
      <span class="file-label"> Danger file… </span>
    </span>
    <span class="file-name"> Screen Shot 2017-07-29 at 15.54.25.png </span>
  </label>
</div>

Sizes
#

You can append one of the 4 available sizes:

    is-small
    is-normal (default)
    is-medium
    is-large

Example

HTML

<div class="file is-small">
  <label class="file-label">
    <input class="file-input" type="file" name="resume" />
    <span class="file-cta">
      <span class="file-icon">
        <i class="fas fa-upload"></i>
      </span>
      <span class="file-label"> Small file… </span>
    </span>
  </label>
</div>

Example

HTML

<div class="file is-normal">
  <label class="file-label">
    <input class="file-input" type="file" name="resume" />
    <span class="file-cta">
      <span class="file-icon">
        <i class="fas fa-upload"></i>
      </span>
      <span class="file-label"> Normal file… </span>
    </span>
  </label>
</div>

Example

HTML

<div class="file is-medium">
  <label class="file-label">
    <input class="file-input" type="file" name="resume" />
    <span class="file-cta">
      <span class="file-icon">
        <i class="fas fa-upload"></i>
      </span>
      <span class="file-label"> Medium file… </span>
    </span>
  </label>
</div>

Example

HTML

<div class="file is-large">
  <label class="file-label">
    <input class="file-input" type="file" name="resume" />
    <span class="file-cta">
      <span class="file-icon">
        <i class="fas fa-upload"></i>
      </span>
      <span class="file-label"> Large file… </span>
    </span>
  </label>
</div>

Example

HTML

<div class="file is-small has-name">
  <label class="file-label">
    <input class="file-input" type="file" name="resume" />
    <span class="file-cta">
      <span class="file-icon">
        <i class="fas fa-upload"></i>
      </span>
      <span class="file-label"> Small file… </span>
    </span>
    <span class="file-name"> Screen Shot 2017-07-29 at 15.54.25.png </span>
  </label>
</div>

Example

HTML

<div class="file is-normal has-name">
  <label class="file-label">
    <input class="file-input" type="file" name="resume" />
    <span class="file-cta">
      <span class="file-icon">
        <i class="fas fa-upload"></i>
      </span>
      <span class="file-label"> Normal file… </span>
    </span>
    <span class="file-name"> Screen Shot 2017-07-29 at 15.54.25.png </span>
  </label>
</div>

Example

HTML

<div class="file is-medium has-name">
  <label class="file-label">
    <input class="file-input" type="file" name="resume" />
    <span class="file-cta">
      <span class="file-icon">
        <i class="fas fa-upload"></i>
      </span>
      <span class="file-label"> Medium file… </span>
    </span>
    <span class="file-name"> Screen Shot 2017-07-29 at 15.54.25.png </span>
  </label>
</div>

Example

HTML

<div class="file is-large has-name">
  <label class="file-label">
    <input class="file-input" type="file" name="resume" />
    <span class="file-cta">
      <span class="file-icon">
        <i class="fas fa-upload"></i>
      </span>
      <span class="file-label"> Large file… </span>
    </span>
    <span class="file-name"> Screen Shot 2017-07-29 at 15.54.25.png </span>
  </label>
</div>

Example

HTML

<div class="file is-small is-boxed">
  <label class="file-label">
    <input class="file-input" type="file" name="resume" />
    <span class="file-cta">
      <span class="file-icon">
        <i class="fas fa-upload"></i>
      </span>
      <span class="file-label"> Small file… </span>
    </span>
  </label>
</div>

Example

HTML

<div class="file is-normal is-boxed">
  <label class="file-label">
    <input class="file-input" type="file" name="resume" />
    <span class="file-cta">
      <span class="file-icon">
        <i class="fas fa-upload"></i>
      </span>
      <span class="file-label"> Normal file… </span>
    </span>
  </label>
</div>

Example

HTML

<div class="file is-medium is-boxed">
  <label class="file-label">
    <input class="file-input" type="file" name="resume" />
    <span class="file-cta">
      <span class="file-icon">
        <i class="fas fa-upload"></i>
      </span>
      <span class="file-label"> Medium file… </span>
    </span>
  </label>
</div>

Example

HTML

<div class="file is-large is-boxed">
  <label class="file-label">
    <input class="file-input" type="file" name="resume" />
    <span class="file-cta">
      <span class="file-icon">
        <i class="fas fa-upload"></i>
      </span>
      <span class="file-label"> Large file… </span>
    </span>
  </label>
</div>

Example

HTML

<div class="file is-small is-boxed has-name">
  <label class="file-label">
    <input class="file-input" type="file" name="resume" />
    <span class="file-cta">
      <span class="file-icon">
        <i class="fas fa-upload"></i>
      </span>
      <span class="file-label"> Small file… </span>
    </span>
    <span class="file-name"> Screen Shot 2017-07-29 at 15.54.25.png </span>
  </label>
</div>

Example

HTML

<div class="file is-normal is-boxed has-name">
  <label class="file-label">
    <input class="file-input" type="file" name="resume" />
    <span class="file-cta">
      <span class="file-icon">
        <i class="fas fa-upload"></i>
      </span>
      <span class="file-label"> Normal file… </span>
    </span>
    <span class="file-name"> Screen Shot 2017-07-29 at 15.54.25.png </span>
  </label>
</div>

Example

HTML

<div class="file is-medium is-boxed has-name">
  <label class="file-label">
    <input class="file-input" type="file" name="resume" />
    <span class="file-cta">
      <span class="file-icon">
        <i class="fas fa-upload"></i>
      </span>
      <span class="file-label"> Medium file… </span>
    </span>
    <span class="file-name"> Screen Shot 2017-07-29 at 15.54.25.png </span>
  </label>
</div>

Example

HTML

<div class="file is-large is-boxed has-name">
  <label class="file-label">
    <input class="file-input" type="file" name="resume" />
    <span class="file-cta">
      <span class="file-icon">
        <i class="fas fa-upload"></i>
      </span>
      <span class="file-label"> Large file… </span>
    </span>
    <span class="file-name"> Screen Shot 2017-07-29 at 15.54.25.png </span>
  </label>
</div>

Alignment
#

You can align the file input:

    to the center with the is-centered modifier
    to the right with the is-right modifier

Example

HTML

<div class="file is-centered is-boxed is-success has-name">
  <label class="file-label">
    <input class="file-input" type="file" name="resume" />
    <span class="file-cta">
      <span class="file-icon">
        <i class="fas fa-upload"></i>
      </span>
      <span class="file-label"> Centered file… </span>
    </span>
    <span class="file-name"> Screen Shot 2017-07-29 at 15.54.25.png </span>
  </label>
</div>

Example

HTML

<div class="file is-right is-info">
  <label class="file-label">
    <input class="file-input" type="file" name="resume" />
    <span class="file-cta">
      <span class="file-icon">
        <i class="fas fa-upload"></i>
      </span>
      <span class="file-label"> Right file… </span>
    </span>
    <span class="file-name"> Screen Shot 2017-07-29 at 15.54.25.png </span>
  </label>
</div>

JavaScript
#

A file upload input requires JavaScript to retrieve the selected file name. Here is an example of how this could be done:

Example

HTML

<div id="file-js-example" class="file has-name">
  <label class="file-label">
    <input class="file-input" type="file" name="resume" />
    <span class="file-cta">
      <span class="file-icon">
        <i class="fas fa-upload"></i>
      </span>
      <span class="file-label"> Choose a file… </span>
    </span>
    <span class="file-name"> No file uploaded </span>
  </label>
</div>

<script>
  const fileInput = document.querySelector("#file-js-example input[type=file]");
  fileInput.onchange = () => {
    if (fileInput.files.length > 0) {
      const fileName = document.querySelector("#file-js-example .file-name");
      fileName.textContent = fileInput.files[0].name;
    }
  };
</script>

Sass and CSS variables
#
Sass Variable
	
CSS Variable
	
Value

$file-radius

var(--bulma-file-radius)

var(--bulma-radius)

$file-cta-color

var(--bulma-)

var(--bulma-text)

$file-cta-hover-color

var(--bulma-)

var(--bulma-text-strong)

$file-cta-active-color

var(--bulma-)

var(--bulma-text-strong)

$file-name-border-color

var(--bulma-file-name-border-color)

var(--bulma-border)

$file-name-border-style

var(--bulma-file-name-border-style)

solid

$file-name-border-width

var(--bulma-file-name-border-width)

1px 1px 1px 0

$file-name-max-width

var(--bulma-file-name-max-width)

16em

←
form:
Radio 



Radio button

The mutually exclusive radio buttons in their native format
CSS Masterclass

The radio class is a simple wrapper around the <input type="radio"> HTML elements. It is intentionally not styled, to preserve cross-browser compatibility and the user experience.

Make sure the linked radio buttons have the same value for their name HTML attribute.
Yes No

<div class="control">
  <label class="radio">
    <input type="radio" name="answer" />
    Yes
  </label>
  <label class="radio">
    <input type="radio" name="answer" />
    No
  </label>
</div>

You can check a radio button by default by adding the checked HTML attribute to the <input> element.
Foo Bar

<div class="control">
  <label class="radio">
    <input type="radio" name="foobar" />
    Foo
  </label>
  <label class="radio">
    <input type="radio" name="foobar" checked />
    Bar
  </label>
</div>

You can disable a radio button by adding the disabled HTML attribute to both the <label> and the <input>.
Going Not going Maybe

<div class="control">
  <label class="radio">
    <input type="radio" name="rsvp" />
    Going
  </label>
  <label class="radio">
    <input type="radio" name="rsvp" />
    Not going
  </label>
  <label class="radio" disabled>
    <input type="radio" name="rsvp" disabled />
    Maybe
  </label>
</div>

List of Radio Buttons
#

If you want to list several radio buttons, wrap them in a <div class="radios"> element:
Going
Not going
Maybe

<div class="radios">
  <label class="radio">
    <input type="radio" name="rsvp" />
    Going
  </label>
  <label class="radio">
    <input type="radio" name="rsvp" />
    Not going
  </label>
  <label class="radio" disabled>
    <input type="radio" name="rsvp" disabled />
    Maybe
  </label>
</div>



Checkbox

The 2-state checkbox in its native format
CSS Masterclass

The checkbox class is a simple wrapper around the <input type="checkbox"> HTML element. It is intentionally not styled, to preserve cross-browser compatibility and the user experience.
Remember me

<label class="checkbox">
  <input type="checkbox" />
  Remember me
</label>

You can add links to your checkbox, or even disable it.
I agree to the terms and conditions

<label class="checkbox">
  <input type="checkbox" />
  I agree to the <a href="#">terms and conditions</a>
</label>

Save my preferences

<label class="checkbox" disabled>
  <input type="checkbox" disabled />
  Save my preferences
</label>

List of Checkboxes
#

If you want to list several checkbox elements, wrap them in a <div class="checkboxes"> element:
Monday
Tuesday
Wednesday
Thursday
Friday
Saturday
Sunday

<div class="checkboxes">
  <label class="checkbox">
    <input type="checkbox" />
    Monday
  </label>

  <label class="checkbox">
    <input type="checkbox" />
    Tuesday
  </label>

  <label class="checkbox">
    <input type="checkbox" />
    Wednesday
  </label>

  <label class="checkbox">
    <input type="checkbox" />
    Thursday
  </label>

  <label class="checkbox">
    <input type="checkbox" />
    Friday
  </label>

  <label class="checkbox">
    <input type="checkbox" checked />
    Saturday
  </label>

  <label class="checkbox">
    <input type="checkbox" checked />
    Sunday
  </label>
</div>



Select

The browser built-in select dropdown, styled accordingly
CSS Masterclass

The select class is a simple wrapper around the <select> HTML element, which gives the styling more flexibility and support for icons.

<div class="select">
  <select>
    <option>Select dropdown</option>
    <option>With options</option>
  </select>
</div>

Several modifiers are supported which affect:

    the color
    the size
    the state

Multiple select
#

You can style a multiple select dropdown, by using the is-multiple modifier, and by using the multiple HTML attribute.

<div class="select is-multiple">
  <select multiple size="8">
    <option value="Argentina">Argentina</option>
    <option value="Bolivia">Bolivia</option>
    <option value="Brazil">Brazil</option>
    <option value="Chile">Chile</option>
    <option value="Colombia">Colombia</option>
    <option value="Ecuador">Ecuador</option>
    <option value="Guyana">Guyana</option>
    <option value="Paraguay">Paraguay</option>
    <option value="Peru">Peru</option>
    <option value="Suriname">Suriname</option>
    <option value="Uruguay">Uruguay</option>
    <option value="Venezuela">Venezuela</option>
  </select>
</div>

Colors
#

Example

HTML

<div class="select is-link">
  <select>
    <option>Select dropdown</option>
    <option>With options</option>
  </select>
</div>

Example

HTML

<div class="select is-primary">
  <select>
    <option>Select dropdown</option>
    <option>With options</option>
  </select>
</div>

Example

HTML

<div class="select is-info">
  <select>
    <option>Select dropdown</option>
    <option>With options</option>
  </select>
</div>

Example

HTML

<div class="select is-success">
  <select>
    <option>Select dropdown</option>
    <option>With options</option>
  </select>
</div>

Example

HTML

<div class="select is-warning">
  <select>
    <option>Select dropdown</option>
    <option>With options</option>
  </select>
</div>

Example

HTML

<div class="select is-danger">
  <select>
    <option>Select dropdown</option>
    <option>With options</option>
  </select>
</div>

Styles
#

You can create a rounded dropdown by appending the is-rounded modifier:

<div class="select is-rounded">
  <select>
    <option>Rounded dropdown</option>
    <option>With options</option>
  </select>
</div>

Sizes
#

The select element comes in 4 different sizes:

Example

HTML

<div class="select is-small">
  <select>
    <option>Select dropdown</option>
    <option>With options</option>
  </select>
</div>

Example

HTML

<div class="select is-normal">
  <select>
    <option>Select dropdown</option>
    <option>With options</option>
  </select>
</div>

Example

HTML

<div class="select is-medium">
  <select>
    <option>Select dropdown</option>
    <option>With options</option>
  </select>
</div>

Example

HTML

<div class="select is-large">
  <select>
    <option>Select dropdown</option>
    <option>With options</option>
  </select>
</div>

States
#

Bulma styles the different states of the select element. Each state is available as a pseudo-class and a CSS class:

    :hover and is-hovered
    :focus and is-focused
    :active and is-active

This allows you to obtain the style of a certain state without having to trigger it.
Normal

<div class="select">
  <select>
    <option>Select dropdown</option>
    <option>With options</option>
  </select>
</div>

Hover

<div class="select">
  <select class="is-hovered">
    <option>Select dropdown</option>
    <option>With options</option>
  </select>
</div>

Focus

<div class="select">
  <select class="is-focused">
    <option>Select dropdown</option>
    <option>With options</option>
  </select>
</div>

Loading

<div class="select is-loading">
  <select>
    <option>Select dropdown</option>
    <option>With options</option>
  </select>
</div>

With icons
#

You can append the modifier on a control:

    has-icons-left

You also need to add a modifier on the icon:

    icon is-left since has-icons-left is used

The size of the select will define the size of the icon container.

<div class="control has-icons-left">
  <div class="select">
    <select>
      <option selected>Country</option>
      <option>Select dropdown</option>
      <option>With options</option>
    </select>
  </div>
  <div class="icon is-small is-left">
    <i class="fas fa-globe"></i>
  </div>
</div>

If the control contains an icon, Bulma will make sure the icon remains centered, no matter the size of the input or of the icon.

<div class="control has-icons-left">
  <div class="select is-small">
    <select>
      <option selected>Country</option>
      <option>Select dropdown</option>
      <option>With options</option>
    </select>
  </div>
  <span class="icon is-small is-left">
    <i class="fas fa-globe"></i>
  </span>
</div>

<div class="control has-icons-left">
  <div class="select">
    <select>
      <option selected>Country</option>
      <option>Select dropdown</option>
      <option>With options</option>
    </select>
  </div>
  <span class="icon is-left">
    <i class="fas fa-globe"></i>
  </span>
</div>

<div class="control has-icons-left">
  <div class="select is-medium">
    <select>
      <option selected>Country</option>
      <option>Select dropdown</option>
      <option>With options</option>
    </select>
  </div>
  <span class="icon is-medium is-left">
    <i class="fas fa-globe"></i>
  </span>
</div>

<div class="control has-icons-left">
  <div class="select is-large">
    <select>
      <option selected>Country</option>
      <option>Select dropdown</option>
      <option>With options</option>
    </select>
  </div>
  <span class="icon is-large is-left">
    <i class="fas fa-globe"></i>
  </span>
</div>




Textarea

The multiline textarea and its variations
CSS Masterclass

The Bulma textarea CSS class is the multiline version of the input element:

Example

HTML

<textarea class="textarea" placeholder="e.g. Hello world"></textarea>

You can set the height of the textarea using the rows HTML attribute.

Example

HTML

<textarea
  class="textarea"
  placeholder="10 lines of textarea"
  rows="10"
></textarea>

Colors
#

The textarea element is available in several colors:

Example

HTML

<textarea
  class="textarea is-link"
  placeholder="Link textarea"
></textarea>

Example

HTML

<textarea
  class="textarea is-primary"
  placeholder="Primary textarea"
></textarea>

Example

HTML

<textarea
  class="textarea is-info"
  placeholder="Info textarea"
></textarea>

Example

HTML

<textarea
  class="textarea is-success"
  placeholder="Success textarea"
></textarea>

Example

HTML

<textarea
  class="textarea is-warning"
  placeholder="Warning textarea"
></textarea>

Example

HTML

<textarea
  class="textarea is-danger"
  placeholder="Danger textarea"
></textarea>

Sizes
#

The textarea element comes in 4 different sizes:

Example

HTML

<div class="field">
  <div class="control">
    <textarea class="textarea is-small" placeholder="Small textarea"></textarea>
  </div>
</div>
<div class="field">
  <div class="control">
    <textarea class="textarea" placeholder="Normal textarea"></textarea>
  </div>
</div>
<div class="field">
  <div class="control">
    <textarea
      class="textarea is-medium"
      placeholder="Medium textarea"
    ></textarea>
  </div>
</div>
<div class="field">
  <div class="control">
    <textarea class="textarea is-large" placeholder="Large textarea"></textarea>
  </div>
</div>

States
#

Bulma styles the different states of the textarea element. Each state is available as a pseudo-class and a CSS class:

    :hover and is-hovered
    :focus and is-focused
    :active and is-active

This allows you to obtain the style of a certain state without having to trigger it.
Normal

Example

HTML

<div class="control">
  <textarea class="textarea" placeholder="Normal textarea"></textarea>
</div>

Hover

Example

HTML

<div class="control">
  <textarea
    class="textarea is-hovered"
    placeholder="Hovered textarea"
  ></textarea>
</div>

Focus

Example

HTML

<div class="control">
  <textarea
    class="textarea is-focused"
    placeholder="Focused textarea"
  ></textarea>
</div>

Loading

Example

HTML

<div class="control is-loading">
  <textarea class="textarea" placeholder="Loading textarea"></textarea>
</div>

You can resize the loading spinner by appending is-small, is-medium or is-large to the control container.

<div class="field">
  <div class="control is-small is-loading">
    <textarea
      class="textarea is-small"
      placeholder="Small loading textarea"
    ></textarea>
  </div>
</div>
<div class="field">
  <div class="control is-loading">
    <textarea class="textarea" placeholder="Normal loading textarea"></textarea>
  </div>
</div>
<div class="field">
  <div class="control is-medium is-loading">
    <textarea
      class="textarea is-medium"
      placeholder="Medium loading textarea"
    ></textarea>
  </div>
</div>
<div class="field">
  <div class="control is-large is-loading">
    <textarea
      class="textarea is-large"
      placeholder="Large loading textarea"
    ></textarea>
  </div>
</div>

Disabled

Example

HTML

<div class="control">
  <textarea
    class="textarea"
    placeholder="Disabled textarea"
    disabled
  ></textarea>
</div>

Readonly

If you use the readonly HTML attribute, the textarea will look similar to a normal one, but is not editable and has no shadow.

Example
This content is readonly

HTML

<div class="control">
  <textarea class="textarea" readonly>This content is readonly</textarea>
</div>

Fixed Size

You can disable a textarea resizing by appending the has-fixed-size modifier:

Example

HTML

<div class="control">
  <textarea
    class="textarea has-fixed-size"
    placeholder="Fixed size textarea"
  ></textarea>
</div>

Sass and CSS variables
#
Sass Variable
	
CSS Variable
	
Value

$textarea-padding

var(--bulma-textarea-padding)

var(--bulma-control-padding-horizontal)

$textarea-max-height

var(--bulma-textarea-max-height)

40em

$textarea-min-height

var(--bulma-textarea-min-height)

8em




Input

The text input and its variations
CSS Masterclass

The Bulma input CSS class is meant for <input> HTML elements. The following type attributes are supported:

    type="text"
    type="password"
    type="email"
    type="tel"

Several modifiers are supported which affect:

    the color
    the size
    the state

<input class="input" type="text" placeholder="Text input" />

Colors
#

Example

HTML

<input
  class="input is-link"
  type="text"
  placeholder="Link input"
/>

Example

HTML

<input
  class="input is-primary"
  type="text"
  placeholder="Primary input"
/>

Example

HTML

<input
  class="input is-info"
  type="text"
  placeholder="Info input"
/>

Example

HTML

<input
  class="input is-success"
  type="text"
  placeholder="Success input"
/>

Example

HTML

<input
  class="input is-warning"
  type="text"
  placeholder="Warning input"
/>

Example

HTML

<input
  class="input is-danger"
  type="text"
  placeholder="Danger input"
/>

Sizes
#

Example

HTML

<input
  class="input is-small"
  type="text"
  placeholder="Small input"
/>

Example

HTML

<input
  class="input is-normal"
  type="text"
  placeholder="Normal input"
/>

Example

HTML

<input
  class="input is-medium"
  type="text"
  placeholder="Medium input"
/>

Example

HTML

<input
  class="input is-large"
  type="text"
  placeholder="Large input"
/>

Styles
#

<input class="input is-rounded" type="text" placeholder="Rounded input" />

States
#
Normal

<div class="control">
  <input class="input" type="text" placeholder="Normal input" />
</div>

Hover

<div class="control">
  <input class="input is-hovered" type="text" placeholder="Hovered input" />
</div>

Focus

<div class="control">
  <input class="input is-focused" type="text" placeholder="Focused input" />
</div>

Loading

<div class="control is-loading">
  <input class="input" type="text" placeholder="Loading input" />
</div>

You can resize the loading spinner by appending is-small, is-medium or is-large to the control container.

<div class="field">
  <div class="control is-small is-loading">
    <input
      class="input is-small"
      type="text"
      placeholder="Small loading input"
    />
  </div>
</div>
<div class="field">
  <div class="control is-loading">
    <input class="input" type="text" placeholder="Normal loading input" />
  </div>
</div>
<div class="field">
  <div class="control is-medium is-loading">
    <input
      class="input is-medium"
      type="text"
      placeholder="Medium loading input"
    />
  </div>
</div>
<div class="field">
  <div class="control is-large is-loading">
    <input
      class="input is-large"
      type="text"
      placeholder="Large loading input"
    />
  </div>
</div>

Disabled

<div class="control">
  <input class="input" type="text" placeholder="Disabled input" disabled />
</div>

Readonly and static inputs

If you use the readonly HTML attribute, the input will look similar to a normal one, but is not editable and has no shadow.

<div class="control">
  <input class="input" type="text" value="This text is readonly" readonly />
</div>

If you also append the is-static modifier, it removes the background, border, shadow, and horizontal padding, while maintaining the vertical spacing so you can easily align the input in any context, like a horizontal form.
From

To

<div class="field is-horizontal">
  <div class="field-label is-normal">
    <label class="label">From</label>
  </div>
  <div class="field-body">
    <div class="field">
      <p class="control">
        <input
          class="input is-static"
          type="email"
          value="me@example.com"
          readonly
        />
      </p>
    </div>
  </div>
</div>

<div class="field is-horizontal">
  <div class="field-label is-normal">
    <label class="label">To</label>
  </div>
  <div class="field-body">
    <div class="field">
      <p class="control">
        <input class="input" type="email" placeholder="Recipient email" />
      </p>
    </div>
  </div>
</div>

With Font Awesome icons
#

You can append one of 2 modifiers on a control:

    has-icons-left
    and/or has-icons-right

You also need to add a modifier on the icon:

    icon is-left if has-icons-left is used
    icon is-right if has-icons-right is used

The size of the input will define the size of the icon container.

<div class="field">
  <p class="control has-icons-left has-icons-right">
    <input class="input" type="email" placeholder="Email" />
    <span class="icon is-small is-left">
      <i class="fas fa-envelope"></i>
    </span>
    <span class="icon is-small is-right">
      <i class="fas fa-check"></i>
    </span>
  </p>
</div>
<div class="field">
  <p class="control has-icons-left">
    <input class="input" type="password" placeholder="Password" />
    <span class="icon is-small is-left">
      <i class="fas fa-lock"></i>
    </span>
  </p>
</div>

If the control contains an icon, Bulma will make sure the icon remains centered, no matter the size of the input or of the icon.

<div class="control has-icons-left has-icons-right">
  <input class="input is-small" type="email" placeholder="Email" />
  <span class="icon is-small is-left">
    <i class="fas fa-envelope"></i>
  </span>
  <span class="icon is-small is-right">
    <i class="fas fa-check"></i>
  </span>
</div>

<div class="control has-icons-left has-icons-right">
  <input class="input" type="email" placeholder="Email" />
  <span class="icon is-small is-left">
    <i class="fas fa-envelope"></i>
  </span>
  <span class="icon is-small is-right">
    <i class="fas fa-check"></i>
  </span>
</div>

<div class="control has-icons-left has-icons-right">
  <input class="input is-medium" type="email" placeholder="Email" />
  <span class="icon is-left">
    <i class="fas fa-envelope"></i>
  </span>
  <span class="icon is-right">
    <i class="fas fa-check"></i>
  </span>
</div>

<div class="control has-icons-left has-icons-right">
  <input class="input is-large" type="email" placeholder="Email" />
  <span class="icon is-medium is-left">
    <i class="fas fa-envelope"></i>
  </span>
  <span class="icon is-medium is-right">
    <i class="fas fa-check"></i>
  </span>
</div>

Sass and CSS variables
#
Sass Variable
	
CSS Variable
	
Value

$input-h

var(--bulma-input-h)

var(--bulma-scheme-h)

$input-s

var(--bulma-input-s)

var(--bulma-scheme-s)

$input-l

var(--bulma-input-l)

var(--bulma-scheme-main-l)

$input-border-l

var(--bulma-input-border-l)

var(--bulma-border-l)

$input-border-l-delta

var(--bulma-input-border-l-delta)

0%

$input-hover-border-l-delta

var(--bulma-input-hover-border-l-delta)

var(--bulma-hover-border-l-delta)

$input-active-border-l-delta

var(--bulma-input-active-border-l-delta)

var(--bulma-active-border-l-delta)

$input-color-l

var(--bulma-input-color-l)

var(--bulma-text-strong-l)

$input-background-l

var(--bulma-input-background-l)

var(--bulma-scheme-main-l)

$input-background-l-delta

var(--bulma-input-background-l-delta)

0%

$input-height

var(--bulma-input-height)

var(--bulma-control-height)

$input-shadow

var(--bulma-input-shadow)

inset 0 0.0625em 0.125em hsla(
  var(--bulma-scheme-h),
  var(--bulma-scheme-s),
  var(--bulma-scheme-invert-l),
  0.05
)

$input-placeholder-color

var(--bulma-input-placeholder-color)

hsla(
  var(--bulma-text-h),
  var(--bulma-text-s),
  var(--bulma-text-strong-l),
  0.3
)

$input-focus-h

var(--bulma-input-focus-h)

var(--bulma-focus-h)

$input-focus-s

var(--bulma-input-focus-s)

var(--bulma-focus-s)

$input-focus-l

var(--bulma-input-focus-l)

var(--bulma-focus-l)

$input-focus-shadow-size

var(--bulma-input-focus-shadow-size)

var(--bulma-focus-shadow-size)

$input-focus-shadow-alpha

var(--bulma-input-focus-shadow-alpha)

var(--bulma-focus-shadow-alpha)

$input-disabled-color

var(--bulma-input-disabled-color)

var(--bulma-text-weak)

$input-disabled-background-color

var(--bulma-input-disabled-background-color)

var(--bulma-background)

$input-disabled-border-color

var(--bulma-input-disabled-border-color)

var(--bulma-background)

$input-disabled-placeholder-color

var(--bulma-input-disabled-placeholder-color)

hsla(
  var(--bulma-text-h),
  var(--bulma-text-s),
  var(--bulma-text-weak-l),
  0.3
)

$input-arrow

var(--bulma-input-arrow)

var(--bulma-link)

$input-icon-color

var(--bulma-input-icon-color)

var(--bulma-text-light)

$input-icon-hover-color

var(--bulma-input-icon-hover-color)

var(--bulma-text-weak)

$input-icon-focus-color

var(--bulma-input-icon-focus-color)

var(--bulma-link)

$input-radius

var(--bulma-input-radius)

var(--bulma-radius)



Form controls

All generic form controls, designed for consistency
CSS Masterclass

Bulma supports the following native HTML form elements: <form> <button> <input> <textarea> and <label>.

The following CSS classes are supported:

    label
    input
    textarea
    select
    checkbox
    radio
    button
    help

To maintain an evenly balanced design, Bulma provides a very useful control container with which you can wrap the form controls.
When combining several controls in a form, use the field class as a container, to keep the spacing consistent.
Complete form example
#

Example
Name
Username

This username is available
Email

This email is invalid
Subject
Message
I agree to the terms and conditions
Yes No

HTML

<div class="field">
  <label class="label">Name</label>
  <div class="control">
    <input class="input" type="text" placeholder="Text input">
  </div>
</div>

<div class="field">
  <label class="label">Username</label>
  <div class="control has-icons-left has-icons-right">
    <input class="input is-success" type="text" placeholder="Text input" value="bulma">
    <span class="icon is-small is-left">
      <i class="fas fa-user"></i>
    </span>
    <span class="icon is-small is-right">
      <i class="fas fa-check"></i>
    </span>
  </div>
  <p class="help is-success">This username is available</p>
</div>

<div class="field">
  <label class="label">Email</label>
  <div class="control has-icons-left has-icons-right">
    <input class="input is-danger" type="email" placeholder="Email input" value="hello@">
    <span class="icon is-small is-left">
      <i class="fas fa-envelope"></i>
    </span>
    <span class="icon is-small is-right">
      <i class="fas fa-exclamation-triangle"></i>
    </span>
  </div>
  <p class="help is-danger">This email is invalid</p>
</div>

<div class="field">
  <label class="label">Subject</label>
  <div class="control">
    <div class="select">
      <select>
        <option>Select dropdown</option>
        <option>With options</option>
      </select>
    </div>
  </div>
</div>

<div class="field">
  <label class="label">Message</label>
  <div class="control">
    <textarea class="textarea" placeholder="Textarea"></textarea>
  </div>
</div>

<div class="field">
  <div class="control">
    <label class="checkbox">
      <input type="checkbox">
      I agree to the <a href="#">terms and conditions</a>
    </label>
  </div>
</div>

<div class="field">
  <div class="control">
    <label class="radio">
      <input type="radio" name="question">
      Yes
    </label>
    <label class="radio">
      <input type="radio" name="question">
      No
    </label>
  </div>
</div>

<div class="field is-grouped">
  <div class="control">
    <button class="button is-link">Submit</button>
  </div>
  <div class="control">
    <button class="button is-link is-light">Cancel</button>
  </div>
</div>

For the best results using Bulma, it's recommended to use the control element as often as possible.
Form field
#

The field container is a simple container for:

    a text label
    a form control
    an optional helptext

Example
Label

This is a help text

HTML

<div class="field">
  <label class="label">Label</label>
  <div class="control">
    <input class="input" type="text" placeholder="Text input">
  </div>
  <p class="help">This is a help text</p>
</div>

This container allows form fields to be spaced consistently.

Example
Name
Email

HTML

<div class="field">
  <label class="label">Name</label>
  <div class="control">
    <input class="input" type="text" placeholder="e.g Alex Smith">
  </div>
</div>

<div class="field">
  <label class="label">Email</label>
  <div class="control">
    <input class="input" type="email" placeholder="e.g. alexsmith@gmail.com">
  </div>
</div>

Form control
#

The Bulma control is a versatile block container meant to enhance single form controls. Because it has the same height as the element that it wraps, it can only contain the following Bulma elements:

    input
    select
    button
    icon

This container gives the ability to:

    keep the spacing consistent
    combine form controls into a group
    combine form controls into a list
    append and prepend icons to a form control

Example

HTML

<div class="control">
  <input class="input" type="text" placeholder="Text input">
</div>

Example

HTML

<div class="control">
  <div class="select">
    <select>
      <option>Select dropdown</option>
      <option>With options</option>
    </select>
  </div>
</div>

Example

HTML

<div class="control">
  <button class="button is-primary">Submit</button>
</div>

With icons
#

You can append one of 2 modifiers on a control:

    has-icons-left
    and/or has-icons-right

You also need to add a modifier on the icon:

    icon is-left if has-icons-left is used
    icon is-right if has-icons-right is used

Make sure the input is the control's first child, otherwise the icon may disappear when selected. The size of the input will define the size of the icon container.

Example

HTML

<div class="field">
  <p class="control has-icons-left has-icons-right">
    <input class="input" type="email" placeholder="Email">
    <span class="icon is-small is-left">
      <i class="fas fa-envelope"></i>
    </span>
    <span class="icon is-small is-right">
      <i class="fas fa-check"></i>
    </span>
  </p>
</div>
<div class="field">
  <p class="control has-icons-left">
    <input class="input" type="password" placeholder="Password">
    <span class="icon is-small is-left">
      <i class="fas fa-lock"></i>
    </span>
  </p>
</div>
<div class="field">
  <p class="control">
    <button class="button is-success">
      Login
    </button>
  </p>
</div>

You can append icons to select dropdowns as well.

Example

HTML

<div class="field">
  <p class="control has-icons-left">
    <span class="select">
      <select>
        <option selected>Country</option>
        <option>Select dropdown</option>
        <option>With options</option>
      </select>
    </span>
    <span class="icon is-small is-left">
      <i class="fas fa-globe"></i>
    </span>
  </p>
</div>

If the control contains an icon, Bulma will make sure the icon remains centered, no matter the size of the input or of the icon.

Example
Small input

HTML

<div class="field">
  <label class="label is-small">Small input</label>
  <div class="control has-icons-left has-icons-right">
    <input class="input is-small" type="email" placeholder="Normal">
    <span class="icon is-small is-left">
      <i class="fas fa-envelope"></i>
    </span>
    <span class="icon is-small is-right">
      <i class="fas fa-check"></i>
    </span>
  </div>
</div>

Example
Normal input

HTML

<div class="field">
  <label class="label">Normal input</label>
  <div class="control has-icons-left has-icons-right">
    <input class="input" type="email" placeholder="Extra small">
    <span class="icon is-small is-left">
      <i class="fas fa-envelope fa-xs"></i>
    </span>
    <span class="icon is-small is-right">
      <i class="fas fa-check fa-xs"></i>
    </span>
  </div>
</div>

<div class="field">
  <div class="control has-icons-left has-icons-right">
    <input class="input" type="email" placeholder="Normal">
    <span class="icon is-left">
      <i class="fas fa-envelope"></i>
    </span>
    <span class="icon is-right">
      <i class="fas fa-check"></i>
    </span>
  </div>
</div>

Example
Medium input

HTML

<div class="field">
  <label class="label is-medium">Medium input</label>
  <div class="control has-icons-left has-icons-right">
    <input class="input is-medium" type="email" placeholder="Extra small">
    <span class="icon is-small is-left">
      <i class="fas fa-envelope fa-xs"></i>
    </span>
    <span class="icon is-small is-right">
      <i class="fas fa-check fa-xs"></i>
    </span>
  </div>
</div>

<div class="field">
  <div class="control has-icons-left has-icons-right">
    <input class="input is-medium" type="email" placeholder="Small">
    <span class="icon is-left">
      <i class="fas fa-envelope fa-sm"></i>
    </span>
    <span class="icon is-right">
      <i class="fas fa-check fa-sm"></i>
    </span>
  </div>
</div>

<div class="field">
  <div class="control has-icons-left has-icons-right">
    <input class="input is-medium" type="email" placeholder="Normal">
    <span class="icon is-medium is-left">
      <i class="fas fa-envelope"></i>
    </span>
    <span class="icon is-medium is-right">
      <i class="fas fa-check"></i>
    </span>
  </div>
</div>

Example
Large input

HTML

<div class="field">
  <label class="label is-large">Large input</label>
  <div class="control has-icons-left has-icons-right">
    <input class="input is-large" type="email" placeholder="Extra small">
    <span class="icon is-small is-left">
      <i class="fas fa-envelope fa-xs"></i>
    </span>
    <span class="icon is-small is-right">
      <i class="fas fa-check fa-xs"></i>
    </span>
  </div>
</div>

<div class="field">
  <div class="control has-icons-left has-icons-right">
    <input class="input is-large" type="email" placeholder="Small">
    <span class="icon is-left">
      <i class="fas fa-envelope fa-sm"></i>
    </span>
    <span class="icon is-right">
      <i class="fas fa-check fa-sm"></i>
    </span>
  </div>
</div>

<div class="field">
  <div class="control has-icons-left has-icons-right">
    <input class="input is-large" type="email" placeholder="Normal">
    <span class="icon is-large is-left">
      <i class="fas fa-envelope"></i>
    </span>
    <span class="icon is-large is-right">
      <i class="fas fa-check"></i>
    </span>
  </div>
</div>

<div class="field">
  <div class="control has-icons-left has-icons-right">
    <input class="input is-large" type="email" placeholder="Large">
    <span class="icon is-medium is-left">
      <i class="fas fa-envelope fa-lg"></i>
    </span>
    <span class="icon is-medium is-right">
      <i class="fas fa-check fa-lg"></i>
    </span>
  </div>
</div>

Form addons
#

If you want to attach controls together, use the has-addons modifier on the field container:

Example

HTML

<div class="field has-addons">
  <div class="control">
    <input class="input" type="text" placeholder="Find a repository">
  </div>
  <div class="control">
    <button class="button is-info">
      Search
    </button>
  </div>
</div>

You can attach inputs, buttons, and dropdowns only.

It can be useful to append a static button.

Example

HTML

<div class="field has-addons">
  <p class="control">
    <input class="input" type="text" placeholder="Your email">
  </p>
  <p class="control">
    <a class="button is-static">
      @gmail.com
    </a>
  </p>
</div>

Use the is-expanded modifier on the element you want to fill up the remaining space (in this case, the input):

Example

HTML

<div class="field has-addons">
  <p class="control">
    <span class="select">
      <select>
        <option>$</option>
        <option>£</option>
        <option>€</option>
      </select>
    </span>
  </p>
  <p class="control">
    <input class="input" type="text" placeholder="Amount of money">
  </p>
  <p class="control">
    <button class="button">
      Transfer
    </button>
  </p>
</div>

<div class="field has-addons">
  <p class="control">
    <span class="select">
      <select>
        <option>$</option>
        <option>£</option>
        <option>€</option>
      </select>
    </span>
  </p>
  <p class="control is-expanded">
    <input class="input" type="text" placeholder="Amount of money">
  </p>
  <p class="control">
    <button class="button">
      Transfer
    </button>
  </p>
</div>

If you want a full width select dropdown, pair control is-expanded with select is-fullwidth.

Example

HTML

<div class="field has-addons">
  <div class="control is-expanded">
    <div class="select is-fullwidth">
      <select name="country">
        <option value="Argentina">Argentina</option>
        <option value="Bolivia">Bolivia</option>
        <option value="Brazil">Brazil</option>
        <option value="Chile">Chile</option>
        <option value="Colombia">Colombia</option>
        <option value="Ecuador">Ecuador</option>
        <option value="Guyana">Guyana</option>
        <option value="Paraguay">Paraguay</option>
        <option value="Peru">Peru</option>
        <option value="Suriname">Suriname</option>
        <option value="Uruguay">Uruguay</option>
        <option value="Venezuela">Venezuela</option>
      </select>
    </div>
  </div>
  <div class="control">
    <button type="submit" class="button is-primary">Choose</button>
  </div>
</div>

Use the has-addons-centered or the has-addons-right modifiers to alter the alignment.

Example

HTML

<div class="field has-addons has-addons-centered">
  <p class="control">
    <span class="select">
      <select>
        <option>$</option>
        <option>£</option>
        <option>€</option>
      </select>
    </span>
  </p>
  <p class="control">
    <input class="input" type="text" placeholder="Amount of money">
  </p>
  <p class="control">
    <button class="button is-primary">
      Transfer
    </button>
  </p>
</div>

Example

HTML

<div class="field has-addons has-addons-right">
  <p class="control">
    <span class="select">
      <select>
        <option>$</option>
        <option>£</option>
        <option>€</option>
      </select>
    </span>
  </p>
  <p class="control">
    <input class="input" type="text" placeholder="Amount of money">
  </p>
  <p class="control">
    <button class="button is-primary">
      Transfer
    </button>
  </p>
</div>

Form group
#

If you want to group controls together, use the is-grouped modifier on the field container.

Example

HTML

<div class="field is-grouped">
  <p class="control">
    <button class="button is-primary">
      Submit
    </button>
  </p>
  <p class="control">
    <a class="button is-light">
      Cancel
    </a>
  </p>
</div>

Use the is-grouped-centered or the is-grouped-right modifiers to alter the alignment.

Example

HTML

<div class="field is-grouped is-grouped-centered">
  <p class="control">
    <button class="button is-primary">
      Submit
    </button>
  </p>
  <p class="control">
    <a class="button is-light">
      Cancel
    </a>
  </p>
</div>

Example

HTML

<div class="field is-grouped is-grouped-right">
  <p class="control">
    <button class="button is-primary">
      Submit
    </button>
  </p>
  <p class="control">
    <a class="button is-light">
      Cancel
    </a>
  </p>
</div>

Add the is-expanded modifier on the control element you want to fill up the remaining space with.

Example

HTML

<div class="field is-grouped">
  <p class="control is-expanded">
    <input class="input" type="text" placeholder="Find a repository">
  </p>
  <p class="control">
    <button class="button is-info">
      Search
    </button>
  </p>
</div>

Add the is-grouped-multiline modifier to allow controls to fill up multiple lines. This is ideal for a long list of controls.

Example

HTML

<div class="field is-grouped is-grouped-multiline">
  <p class="control">
    <button class="button">
      One
    </button>
  </p>
  <p class="control">
    <button class="button">
      Two
    </button>
  </p>
  <p class="control">
    <button class="button">
      Three
    </button>
  </p>
  <p class="control">
    <button class="button">
      Four
    </button>
  </p>
  <p class="control">
    <button class="button">
      Five
    </button>
  </p>
  <p class="control">
    <button class="button">
      Six
    </button>
  </p>
  <p class="control">
    <button class="button">
      Seven
    </button>
  </p>
  <p class="control">
    <button class="button">
      Eight
    </button>
  </p>
  <p class="control">
    <button class="button">
      Nine
    </button>
  </p>
  <p class="control">
    <button class="button">
      Ten
    </button>
  </p>
  <p class="control">
    <button class="button">
      Eleven
    </button>
  </p>
  <p class="control">
    <button class="button">
      Twelve
    </button>
  </p>
  <p class="control">
    <button class="button">
      Thirteen
    </button>
  </p>
</div>

List of buttons

If you only need a list of buttons, try out the new buttons class with which you can create a multiline list of buttons.
Horizontal form
#

If you want a horizontal form control, use the is-horizontal modifier on the field container, in which you include:

    field-label for the side label
    field-body for the input/select/textarea container

You can use is-grouped or has-addons for the child elements.

Example
From

Do not enter the first zero
Department
Already a member?
Yes No
Subject

This field is required
Question

HTML

<div class="field is-horizontal">
  <div class="field-label is-normal">
    <label class="label">From</label>
  </div>
  <div class="field-body">
    <div class="field">
      <p class="control is-expanded has-icons-left">
        <input class="input" type="text" placeholder="Name">
        <span class="icon is-small is-left">
          <i class="fas fa-user"></i>
        </span>
      </p>
    </div>
    <div class="field">
      <p class="control is-expanded has-icons-left has-icons-right">
        <input class="input is-success" type="email" placeholder="Email" value="alex@smith.com">
        <span class="icon is-small is-left">
          <i class="fas fa-envelope"></i>
        </span>
        <span class="icon is-small is-right">
          <i class="fas fa-check"></i>
        </span>
      </p>
    </div>
  </div>
</div>

<div class="field is-horizontal">
  <div class="field-label"></div>
  <div class="field-body">
    <div class="field is-expanded">
      <div class="field has-addons">
        <p class="control">
          <a class="button is-static">
            +44
          </a>
        </p>
        <p class="control is-expanded">
          <input class="input" type="tel" placeholder="Your phone number">
        </p>
      </div>
      <p class="help">Do not enter the first zero</p>
    </div>
  </div>
</div>

<div class="field is-horizontal">
  <div class="field-label is-normal">
    <label class="label">Department</label>
  </div>
  <div class="field-body">
    <div class="field is-narrow">
      <div class="control">
        <div class="select is-fullwidth">
          <select>
            <option>Business development</option>
            <option>Marketing</option>
            <option>Sales</option>
          </select>
        </div>
      </div>
    </div>
  </div>
</div>

<div class="field is-horizontal">
  <div class="field-label">
    <label class="label">Already a member?</label>
  </div>
  <div class="field-body">
    <div class="field is-narrow">
      <div class="control">
        <label class="radio">
          <input type="radio" name="member">
          Yes
        </label>
        <label class="radio">
          <input type="radio" name="member">
          No
        </label>
      </div>
    </div>
  </div>
</div>

<div class="field is-horizontal">
  <div class="field-label is-normal">
    <label class="label">Subject</label>
  </div>
  <div class="field-body">
    <div class="field">
      <div class="control">
        <input class="input is-danger" type="text" placeholder="e.g. Partnership opportunity">
      </div>
      <p class="help is-danger">
        This field is required
      </p>
    </div>
  </div>
</div>

<div class="field is-horizontal">
  <div class="field-label is-normal">
    <label class="label">Question</label>
  </div>
  <div class="field-body">
    <div class="field">
      <div class="control">
        <textarea class="textarea" placeholder="Explain how we can help you"></textarea>
      </div>
    </div>
  </div>
</div>

<div class="field is-horizontal">
  <div class="field-label">
    <!-- Left empty for spacing -->
  </div>
  <div class="field-body">
    <div class="field">
      <div class="control">
        <button class="button is-primary">
          Send message
        </button>
      </div>
    </div>
  </div>
</div>

To preserve the vertical alignment of labels with each type and size of control, the field-label comes with 4 size modifiers:

    is-small
    is-normal for any input or button
    is-medium
    is-large

Example
No padding
Checkbox
Small padding
Normal label
Medium label
Large label

HTML

<div class="field is-horizontal">
  <div class="field-label">
    <label class="label">No padding</label>
  </div>
  <div class="field-body">
    <div class="field">
      <div class="control">
        <label class="checkbox">
          <input type="checkbox">
          Checkbox
        </label>
      </div>
    </div>
  </div>
</div>

<div class="field is-horizontal">
  <div class="field-label is-small">
    <label class="label">Small padding</label>
  </div>
  <div class="field-body">
    <div class="field">
      <div class="control">
        <input class="input is-small" type="text" placeholder="Small sized input">
      </div>
    </div>
  </div>
</div>

<div class="field is-horizontal">
  <div class="field-label is-normal">
    <label class="label">Normal label</label>
  </div>
  <div class="field-body">
    <div class="field">
      <div class="control">
        <input class="input" type="text" placeholder="Normal sized input">
      </div>
    </div>
  </div>
</div>

<div class="field is-horizontal">
  <div class="field-label is-medium">
    <label class="label">Medium label</label>
  </div>
  <div class="field-body">
    <div class="field">
      <div class="control">
        <input class="input is-medium" type="text" placeholder="Medium sized input">
      </div>
    </div>
  </div>
</div>

<div class="field is-horizontal">
  <div class="field-label is-large">
    <label class="label">Large label</label>
  </div>
  <div class="field-body">
    <div class="field">
      <div class="control">
        <input class="input is-large" type="text" placeholder="Large sized input">
      </div>
    </div>
  </div>
</div>

Disabled form
#

You can disable part or a whole form by wrapping a set of controls in a fieldset with a disabled HTML attribute.

Example
Name
Email

HTML

<fieldset disabled>
  
<div class="field">
  <label class="label">Name</label>
  <div class="control">
    <input class="input" type="text" placeholder="e.g Alex Smith">
  </div>
</div>

<div class="field">
  <label class="label">Email</label>
  <div class="control">
    <input class="input" type="email" placeholder="e.g. alexsmith@gmail.com">
  </div>
</div>

</fieldset>

Sass and CSS variables
#
Sass Variable
	
CSS Variable
	
Value

$control-radius

var(--bulma-control-radius)

var(--bulma-radius)

$control-radius-small

var(--bulma-control-radius-small)

var(--bulma-radius-small)

$control-border-width

var(--bulma-control-border-width)

1px

$control-size

var(--bulma-control-size)

var(--bulma-size-normal)

$control-height

var(--bulma-control-height)

2.5em

$control-line-height

var(--bulma-control-line-height)

1.5

$control-padding-vertical

var(--bulma-control-padding-vertical)

calc(0.5em - 1px)

$control-padding-horizontal

var(--bulma-control-padding-horizontal)

calc(0.75em - 1px)

$control-focus-shadow-l

var(--bulma-control-focus-shadow-l)

50%

$label-color

var(--bulma-label-color)

var(--bulma-text-strong)

$label-weight

var(--bulma-label-weight)

var(--bulma-weight-semibold)

$help-size

var(--bulma-help-size)

var(--bulma-size-small)



Tabs

Simple responsive horizontal navigation tabs, with different styles
CSS Masterclass

The Bulma tabs are a straightforward navigation component that come in a variety of versions. They only require the following structure:

    a tabs container
    a <ul> HTML element
    a list of <li> HTML element
    <a> HTML anchor elements for each link

The default tabs style has a single border at the bottom.

Example

HTML

<div class="tabs">
  <ul>
    <li class="is-active"><a>Pictures</a></li>
    <li><a>Music</a></li>
    <li><a>Videos</a></li>
    <li><a>Documents</a></li>
  </ul>
</div>

Alignment
#

To align the tabs list, use the is-centered or is-right modifier on the .tabs container:

Example

HTML

<div class="tabs is-centered">
  <ul>
    <li class="is-active"><a>Pictures</a></li>
    <li><a>Music</a></li>
    <li><a>Videos</a></li>
    <li><a>Documents</a></li>
  </ul>
</div>

Example

HTML

<div class="tabs is-right">
  <ul>
    <li class="is-active"><a>Pictures</a></li>
    <li><a>Music</a></li>
    <li><a>Videos</a></li>
    <li><a>Documents</a></li>
  </ul>
</div>

Icons
#

You can use any of the Font Awesome icons.

Example

HTML

<div class="tabs is-centered">
  <ul>
    <li class="is-active">
      <a>
        <span class="icon is-small"
          ><i class="fas fa-image" aria-hidden="true"></i
        ></span>
        <span>Pictures</span>
      </a>
    </li>
    <li>
      <a>
        <span class="icon is-small"
          ><i class="fas fa-music" aria-hidden="true"></i
        ></span>
        <span>Music</span>
      </a>
    </li>
    <li>
      <a>
        <span class="icon is-small"
          ><i class="fas fa-film" aria-hidden="true"></i
        ></span>
        <span>Videos</span>
      </a>
    </li>
    <li>
      <a>
        <span class="icon is-small"
          ><i class="far fa-file-alt" aria-hidden="true"></i
        ></span>
        <span>Documents</span>
      </a>
    </li>
  </ul>
</div>

Sizes
#

You can choose between 3 additional sizes: is-small is-medium and is-large.

Example

HTML

<div class="tabs is-small">
  <ul>
    <li class="is-active"><a>Pictures</a></li>
    <li><a>Music</a></li>
    <li><a>Videos</a></li>
    <li><a>Documents</a></li>
  </ul>
</div>

Example

HTML

<div class="tabs is-medium">
  <ul>
    <li class="is-active"><a>Pictures</a></li>
    <li><a>Music</a></li>
    <li><a>Videos</a></li>
    <li><a>Documents</a></li>
  </ul>
</div>

Example

HTML

<div class="tabs is-large">
  <ul>
    <li class="is-active"><a>Pictures</a></li>
    <li><a>Music</a></li>
    <li><a>Videos</a></li>
    <li><a>Documents</a></li>
  </ul>
</div>

Styles
#
If you want a more classic style with borders, just append the is-boxed modifier.

Example

HTML

<div class="tabs is-boxed">
  <ul>
    <li class="is-active">
      <a>
        <span class="icon is-small"
          ><i class="fas fa-image" aria-hidden="true"></i
        ></span>
        <span>Pictures</span>
      </a>
    </li>
    <li>
      <a>
        <span class="icon is-small"
          ><i class="fas fa-music" aria-hidden="true"></i
        ></span>
        <span>Music</span>
      </a>
    </li>
    <li>
      <a>
        <span class="icon is-small"
          ><i class="fas fa-film" aria-hidden="true"></i
        ></span>
        <span>Videos</span>
      </a>
    </li>
    <li>
      <a>
        <span class="icon is-small"
          ><i class="far fa-file-alt" aria-hidden="true"></i
        ></span>
        <span>Documents</span>
      </a>
    </li>
  </ul>
</div>

If you want mutually exclusive tabs (like radio buttons where clicking one deselects all other ones), use the is-toggle modifier.

Example

HTML

<div class="tabs is-toggle">
  <ul>
    <li class="is-active">
      <a>
        <span class="icon is-small"
          ><i class="fas fa-image" aria-hidden="true"></i
        ></span>
        <span>Pictures</span>
      </a>
    </li>
    <li>
      <a>
        <span class="icon is-small"
          ><i class="fas fa-music" aria-hidden="true"></i
        ></span>
        <span>Music</span>
      </a>
    </li>
    <li>
      <a>
        <span class="icon is-small"
          ><i class="fas fa-film" aria-hidden="true"></i
        ></span>
        <span>Videos</span>
      </a>
    </li>
    <li>
      <a>
        <span class="icon is-small"
          ><i class="far fa-file-alt" aria-hidden="true"></i
        ></span>
        <span>Documents</span>
      </a>
    </li>
  </ul>
</div>

If you use both is-toggle and is-toggle-rounded, the first and last items will be rounded.

Example

HTML

<div class="tabs is-toggle is-toggle-rounded">
  <ul>
    <li class="is-active">
      <a>
        <span class="icon is-small"><i class="fas fa-image"></i></span>
        <span>Pictures</span>
      </a>
    </li>
    <li>
      <a>
        <span class="icon is-small"><i class="fas fa-music"></i></span>
        <span>Music</span>
      </a>
    </li>
    <li>
      <a>
        <span class="icon is-small"><i class="fas fa-film"></i></span>
        <span>Videos</span>
      </a>
    </li>
    <li>
      <a>
        <span class="icon is-small"><i class="fas fa-file-alt"></i></span>
        <span>Documents</span>
      </a>
    </li>
  </ul>
</div>

If you want the tabs to take up the whole width available, use is-fullwidth.

Example

HTML

<div class="tabs is-fullwidth">
  <ul>
    <li>
      <a>
        <span class="icon"
          ><i class="fas fa-angle-left" aria-hidden="true"></i
        ></span>
        <span>Left</span>
      </a>
    </li>
    <li>
      <a>
        <span class="icon"
          ><i class="fas fa-angle-up" aria-hidden="true"></i
        ></span>
        <span>Up</span>
      </a>
    </li>
    <li>
      <a>
        <span>Right</span>
        <span class="icon"
          ><i class="fas fa-angle-right" aria-hidden="true"></i
        ></span>
      </a>
    </li>
  </ul>
</div>

Combining
#

You can combine different modifiers. For example, you can have centered boxed tabs, or fullwidth toggle ones.

Example

HTML

<div class="tabs is-centered is-boxed">
  <ul>
    <li class="is-active">
      <a>
        <span class="icon is-small"
          ><i class="fas fa-image" aria-hidden="true"></i
        ></span>
        <span>Pictures</span>
      </a>
    </li>
    <li>
      <a>
        <span class="icon is-small"
          ><i class="fas fa-music" aria-hidden="true"></i
        ></span>
        <span>Music</span>
      </a>
    </li>
    <li>
      <a>
        <span class="icon is-small"
          ><i class="fas fa-film" aria-hidden="true"></i
        ></span>
        <span>Videos</span>
      </a>
    </li>
    <li>
      <a>
        <span class="icon is-small"
          ><i class="far fa-file-alt" aria-hidden="true"></i
        ></span>
        <span>Documents</span>
      </a>
    </li>
  </ul>
</div>

Example

HTML

<div class="tabs is-toggle is-fullwidth">
  <ul>
    <li class="is-active">
      <a>
        <span class="icon is-small"
          ><i class="fas fa-image" aria-hidden="true"></i
        ></span>
        <span>Pictures</span>
      </a>
    </li>
    <li>
      <a>
        <span class="icon is-small"
          ><i class="fas fa-music" aria-hidden="true"></i
        ></span>
        <span>Music</span>
      </a>
    </li>
    <li>
      <a>
        <span class="icon is-small"
          ><i class="fas fa-film" aria-hidden="true"></i
        ></span>
        <span>Videos</span>
      </a>
    </li>
    <li>
      <a>
        <span class="icon is-small"
          ><i class="far fa-file-alt" aria-hidden="true"></i
        ></span>
        <span>Documents</span>
      </a>
    </li>
  </ul>
</div>

Example

HTML

<div class="tabs is-centered is-boxed is-medium">
  <ul>
    <li class="is-active">
      <a>
        <span class="icon is-small"
          ><i class="fas fa-image" aria-hidden="true"></i
        ></span>
        <span>Pictures</span>
      </a>
    </li>
    <li>
      <a>
        <span class="icon is-small"
          ><i class="fas fa-music" aria-hidden="true"></i
        ></span>
        <span>Music</span>
      </a>
    </li>
    <li>
      <a>
        <span class="icon is-small"
          ><i class="fas fa-film" aria-hidden="true"></i
        ></span>
        <span>Videos</span>
      </a>
    </li>
    <li>
      <a>
        <span class="icon is-small"
          ><i class="far fa-file-alt" aria-hidden="true"></i
        ></span>
        <span>Documents</span>
      </a>
    </li>
  </ul>
</div>

Example

HTML

<div class="tabs is-toggle is-fullwidth is-large">
  <ul>
    <li class="is-active">
      <a>
        <span class="icon"
          ><i class="fas fa-image" aria-hidden="true"></i
        ></span>
        <span>Pictures</span>
      </a>
    </li>
    <li>
      <a>
        <span class="icon"
          ><i class="fas fa-music" aria-hidden="true"></i
        ></span>
        <span>Music</span>
      </a>
    </li>
    <li>
      <a>
        <span class="icon"><i class="fas fa-film" aria-hidden="true"></i></span>
        <span>Videos</span>
      </a>
    </li>
    <li>
      <a>
        <span class="icon"
          ><i class="far fa-file-alt" aria-hidden="true"></i
        ></span>
        <span>Documents</span>
      </a>
    </li>
  </ul>
</div>

Sass and CSS variables
#
Sass Variable
	
CSS Variable
	
Value

$tabs-border-bottom-color

var(--bulma-tabs-border-bottom-color)

var(--bulma-border)

$tabs-border-bottom-style

var(--bulma-tabs-border-bottom-style)

solid

$tabs-border-bottom-width

var(--bulma-tabs-border-bottom-width)

1px

$tabs-link-color

var(--bulma-tabs-link-color)

var(--bulma-text)

$tabs-link-hover-border-bottom-color

var(--bulma-tabs-link-hover-border-bottom-color)

var(--bulma-text-strong)

$tabs-link-hover-color

var(--bulma-tabs-link-hover-color)

var(--bulma-text-strong)

$tabs-link-active-border-bottom-color

var(--bulma-tabs-link-active-border-bottom-color)

var(--bulma-link-text)

$tabs-link-active-color

var(--bulma-tabs-link-active-color)

var(--bulma-link-text)

$tabs-link-padding

var(--bulma-tabs-link-padding)

0.5em 1em

$tabs-boxed-link-radius

var(--bulma-tabs-boxed-link-radius)

var(--bulma-radius)

$tabs-boxed-link-hover-background-color

var(--bulma-tabs-boxed-link-hover-background-color)

var(--bulma-background)

$tabs-boxed-link-hover-border-bottom-color

var(--bulma-tabs-boxed-link-hover-border-bottom-color)

var(--bulma-border)

$tabs-boxed-link-active-background-color

var(--bulma-tabs-boxed-link-active-background-color)

var(--bulma-scheme-main)

$tabs-boxed-link-active-border-color

var(--bulma-tabs-boxed-link-active-border-color)

var(--bulma-border)

$tabs-boxed-link-active-border-bottom-color

var(--bulma-tabs-boxed-link-active-border-bottom-color)

transparent

$tabs-toggle-link-border-color

var(--bulma-tabs-toggle-link-border-color)

var(--bulma-border)

$tabs-toggle-link-border-style

var(--bulma-tabs-toggle-link-border-style)

solid

$tabs-toggle-link-border-width

var(--bulma-tabs-toggle-link-border-width)

1px

$tabs-toggle-link-hover-background-color

var(--bulma-tabs-toggle-link-hover-background-color)

var(--bulma-background)

$tabs-toggle-link-hover-border-color

var(--bulma-tabs-toggle-link-hover-border-color)

var(--bulma-border-hover)

$tabs-toggle-link-radius

var(--bulma-tabs-toggle-link-radius)

var(--bulma-radius)

$tabs-toggle-link-active-background-color

var(--bulma-tabs-toggle-link-active-background-color)

var(--bulma-link)

$tabs-toggle-link-active-border-color

var(--bulma-tabs-toggle-link-active-border-color)

var(--bulma-link)

$tabs-toggle-link-active-color

var(--bulma-tabs-toggle-link-active-color)

var(--bulma-link-invert)



Panel

A composable panel, for compact controls
CSS Masterclass

The panel is a container for several types:

    panel-heading as the first child
    panel-tabs for navigation
    panel-block which can contain other elements, like:
        control
        input
        button
        panel-icon

The panel-block can be an anchor tag <a> or a label <label> with a checkbox inside.

Example

Repositories

All
Public
Private
Sources
Forks
bulma
marksheet
minireset.css
jgthms.github.io
daniellowtw/infboard
mojs
remember me

HTML

<nav class="panel">
  <p class="panel-heading">Repositories</p>
  <div class="panel-block">
    <p class="control has-icons-left">
      <input class="input" type="text" placeholder="Search" />
      <span class="icon is-left">
        <i class="fas fa-search" aria-hidden="true"></i>
      </span>
    </p>
  </div>
  <p class="panel-tabs">
    <a class="is-active">All</a>
    <a>Public</a>
    <a>Private</a>
    <a>Sources</a>
    <a>Forks</a>
  </p>
  <a class="panel-block is-active">
    <span class="panel-icon">
      <i class="fas fa-book" aria-hidden="true"></i>
    </span>
    bulma
  </a>
  <a class="panel-block">
    <span class="panel-icon">
      <i class="fas fa-book" aria-hidden="true"></i>
    </span>
    marksheet
  </a>
  <a class="panel-block">
    <span class="panel-icon">
      <i class="fas fa-book" aria-hidden="true"></i>
    </span>
    minireset.css
  </a>
  <a class="panel-block">
    <span class="panel-icon">
      <i class="fas fa-book" aria-hidden="true"></i>
    </span>
    jgthms.github.io
  </a>
  <a class="panel-block">
    <span class="panel-icon">
      <i class="fas fa-code-branch" aria-hidden="true"></i>
    </span>
    daniellowtw/infboard
  </a>
  <a class="panel-block">
    <span class="panel-icon">
      <i class="fas fa-code-branch" aria-hidden="true"></i>
    </span>
    mojs
  </a>
  <label class="panel-block">
    <input type="checkbox" />
    remember me
  </label>
  <div class="panel-block">
    <button class="button is-link is-outlined is-fullwidth">
      Reset all filters
    </button>
  </div>
</nav>

Colors
#

The panel component is available in all the different colors defined by the $colors Sass map. Simply append one of the color modifiers.

For example, to use your primary color, use "panel is-primary" as a class.

Example

Link

All
Public
Private
Sources
Forks

bulma
marksheet
minireset.css
jgthms.github.io

HTML

<article class="panel is-link">
  <p class="panel-heading">Link</p>
  <p class="panel-tabs">
    <a class="is-active">All</a>
    <a>Public</a>
    <a>Private</a>
    <a>Sources</a>
    <a>Forks</a>
  </p>
  <div class="panel-block">
    <p class="control has-icons-left">
      <input class="input is-link" type="text" placeholder="Search" />
      <span class="icon is-left">
        <i class="fas fa-search" aria-hidden="true"></i>
      </span>
    </p>
  </div>
  <a class="panel-block is-active">
    <span class="panel-icon">
      <i class="fas fa-book" aria-hidden="true"></i>
    </span>
    bulma
  </a>
  <a class="panel-block">
    <span class="panel-icon">
      <i class="fas fa-book" aria-hidden="true"></i>
    </span>
    marksheet
  </a>
  <a class="panel-block">
    <span class="panel-icon">
      <i class="fas fa-book" aria-hidden="true"></i>
    </span>
    minireset.css
  </a>
  <a class="panel-block">
    <span class="panel-icon">
      <i class="fas fa-book" aria-hidden="true"></i>
    </span>
    jgthms.github.io
  </a>
</article>

Example

Primary

All
Public
Private
Sources
Forks

bulma
marksheet
minireset.css
jgthms.github.io

HTML

<article class="panel is-primary">
  <p class="panel-heading">Primary</p>
  <p class="panel-tabs">
    <a class="is-active">All</a>
    <a>Public</a>
    <a>Private</a>
    <a>Sources</a>
    <a>Forks</a>
  </p>
  <div class="panel-block">
    <p class="control has-icons-left">
      <input class="input is-primary" type="text" placeholder="Search" />
      <span class="icon is-left">
        <i class="fas fa-search" aria-hidden="true"></i>
      </span>
    </p>
  </div>
  <a class="panel-block is-active">
    <span class="panel-icon">
      <i class="fas fa-book" aria-hidden="true"></i>
    </span>
    bulma
  </a>
  <a class="panel-block">
    <span class="panel-icon">
      <i class="fas fa-book" aria-hidden="true"></i>
    </span>
    marksheet
  </a>
  <a class="panel-block">
    <span class="panel-icon">
      <i class="fas fa-book" aria-hidden="true"></i>
    </span>
    minireset.css
  </a>
  <a class="panel-block">
    <span class="panel-icon">
      <i class="fas fa-book" aria-hidden="true"></i>
    </span>
    jgthms.github.io
  </a>
</article>

Example

Info

All
Public
Private
Sources
Forks

bulma
marksheet
minireset.css
jgthms.github.io

HTML

<article class="panel is-info">
  <p class="panel-heading">Info</p>
  <p class="panel-tabs">
    <a class="is-active">All</a>
    <a>Public</a>
    <a>Private</a>
    <a>Sources</a>
    <a>Forks</a>
  </p>
  <div class="panel-block">
    <p class="control has-icons-left">
      <input class="input is-info" type="text" placeholder="Search" />
      <span class="icon is-left">
        <i class="fas fa-search" aria-hidden="true"></i>
      </span>
    </p>
  </div>
  <a class="panel-block is-active">
    <span class="panel-icon">
      <i class="fas fa-book" aria-hidden="true"></i>
    </span>
    bulma
  </a>
  <a class="panel-block">
    <span class="panel-icon">
      <i class="fas fa-book" aria-hidden="true"></i>
    </span>
    marksheet
  </a>
  <a class="panel-block">
    <span class="panel-icon">
      <i class="fas fa-book" aria-hidden="true"></i>
    </span>
    minireset.css
  </a>
  <a class="panel-block">
    <span class="panel-icon">
      <i class="fas fa-book" aria-hidden="true"></i>
    </span>
    jgthms.github.io
  </a>
</article>

Example

Success

All
Public
Private
Sources
Forks

bulma
marksheet
minireset.css
jgthms.github.io

HTML

<article class="panel is-success">
  <p class="panel-heading">Success</p>
  <p class="panel-tabs">
    <a class="is-active">All</a>
    <a>Public</a>
    <a>Private</a>
    <a>Sources</a>
    <a>Forks</a>
  </p>
  <div class="panel-block">
    <p class="control has-icons-left">
      <input class="input is-success" type="text" placeholder="Search" />
      <span class="icon is-left">
        <i class="fas fa-search" aria-hidden="true"></i>
      </span>
    </p>
  </div>
  <a class="panel-block is-active">
    <span class="panel-icon">
      <i class="fas fa-book" aria-hidden="true"></i>
    </span>
    bulma
  </a>
  <a class="panel-block">
    <span class="panel-icon">
      <i class="fas fa-book" aria-hidden="true"></i>
    </span>
    marksheet
  </a>
  <a class="panel-block">
    <span class="panel-icon">
      <i class="fas fa-book" aria-hidden="true"></i>
    </span>
    minireset.css
  </a>
  <a class="panel-block">
    <span class="panel-icon">
      <i class="fas fa-book" aria-hidden="true"></i>
    </span>
    jgthms.github.io
  </a>
</article>

Example

Warning

All
Public
Private
Sources
Forks

bulma
marksheet
minireset.css
jgthms.github.io

HTML

<article class="panel is-warning">
  <p class="panel-heading">Warning</p>
  <p class="panel-tabs">
    <a class="is-active">All</a>
    <a>Public</a>
    <a>Private</a>
    <a>Sources</a>
    <a>Forks</a>
  </p>
  <div class="panel-block">
    <p class="control has-icons-left">
      <input class="input is-warning" type="text" placeholder="Search" />
      <span class="icon is-left">
        <i class="fas fa-search" aria-hidden="true"></i>
      </span>
    </p>
  </div>
  <a class="panel-block is-active">
    <span class="panel-icon">
      <i class="fas fa-book" aria-hidden="true"></i>
    </span>
    bulma
  </a>
  <a class="panel-block">
    <span class="panel-icon">
      <i class="fas fa-book" aria-hidden="true"></i>
    </span>
    marksheet
  </a>
  <a class="panel-block">
    <span class="panel-icon">
      <i class="fas fa-book" aria-hidden="true"></i>
    </span>
    minireset.css
  </a>
  <a class="panel-block">
    <span class="panel-icon">
      <i class="fas fa-book" aria-hidden="true"></i>
    </span>
    jgthms.github.io
  </a>
</article>

Example

Danger

All
Public
Private
Sources
Forks

bulma
marksheet
minireset.css
jgthms.github.io

HTML

<article class="panel is-danger">
  <p class="panel-heading">Danger</p>
  <p class="panel-tabs">
    <a class="is-active">All</a>
    <a>Public</a>
    <a>Private</a>
    <a>Sources</a>
    <a>Forks</a>
  </p>
  <div class="panel-block">
    <p class="control has-icons-left">
      <input class="input is-danger" type="text" placeholder="Search" />
      <span class="icon is-left">
        <i class="fas fa-search" aria-hidden="true"></i>
      </span>
    </p>
  </div>
  <a class="panel-block is-active">
    <span class="panel-icon">
      <i class="fas fa-book" aria-hidden="true"></i>
    </span>
    bulma
  </a>
  <a class="panel-block">
    <span class="panel-icon">
      <i class="fas fa-book" aria-hidden="true"></i>
    </span>
    marksheet
  </a>
  <a class="panel-block">
    <span class="panel-icon">
      <i class="fas fa-book" aria-hidden="true"></i>
    </span>
    minireset.css
  </a>
  <a class="panel-block">
    <span class="panel-icon">
      <i class="fas fa-book" aria-hidden="true"></i>
    </span>
    jgthms.github.io
  </a>
</article>

Sass and CSS variables
#
Sass Variable
	
CSS Variable
	
Value

$panel-margin

var(--bulma-panel-margin)

var(--bulma-block-spacing)

$panel-item-border

var(--bulma-panel-item-border)

1px solid var(--bulma-border-weak)

$panel-radius

var(--bulma-panel-radius)

var(--bulma-radius-large)

$panel-shadow

var(--bulma-panel-shadow)

var(--bulma-shadow)

$panel-heading-line-height

var(--bulma-panel-heading-line-height)

1.25

$panel-heading-padding

var(--bulma-panel-heading-padding)

1em 1.25em

$panel-heading-radius

var(--bulma-panel-heading-radius)

var(--bulma-radius)

$panel-heading-size

var(--bulma-panel-heading-size)

1.25em

$panel-heading-weight

var(--bulma-panel-heading-weight)

var(--bulma-weight-bold)

$panel-tabs-font-size

var(--bulma-panel-tabs-font-size)

1em

$panel-tab-border-bottom-color

var(--bulma-panel-tab-border-bottom-color)

var(--bulma-border)

$panel-tab-border-bottom-style

var(--bulma-panel-tab-border-bottom-style)

solid

$panel-tab-border-bottom-width

var(--bulma-panel-tab-border-bottom-width)

1px

$panel-tab-active-color

var(--bulma-panel-tab-active-color)

var(--bulma-link-active)

$panel-list-item-color

var(--bulma-panel-list-item-color)

var(--bulma-text)

$panel-list-item-hover-color

var(--bulma-panel-list-item-hover-color)

var(--bulma-link)

$panel-block-color

var(--bulma-panel-block-color)

var(--bulma-text-strong)

$panel-block-hover-background-color

var(--bulma-panel-block-hover-background-color)

var(--bulma-background)

$panel-block-active-border-left-color

var(--bulma-panel-block-active-border-left-color)

var(--bulma-link)

$panel-block-active-color

var(--bulma-panel-block-active-color)

var(--bulma-link-active)

$panel-block-active-icon-color

var(--bulma-panel-block-active-icon-color)

var(--bulma-link)

$panel-icon-color

var(--bulma-panel-icon-color)

var(--bulma-text-weak)



Pagination

A responsive, usable, and flexible pagination
CSS Masterclass

The pagination component consists of several elements:

    pagination-previous and pagination-next for incremental navigation
    pagination-list which displays page items:
        pagination-link for the page numbers
        pagination-ellipsis for range separators

All elements are optional so you can compose your pagination as you wish.

Example

HTML

<nav class="pagination" role="navigation" aria-label="pagination">
  <a href="#" class="pagination-previous">Previous</a>
  <a href="#" class="pagination-next">Next page</a>
  <ul class="pagination-list">
    <li>
      <a href="#" class="pagination-link" aria-label="Goto page 1">1</a>
    </li>
    <li>
      <span class="pagination-ellipsis">&hellip;</span>
    </li>
    <li>
      <a href="#" class="pagination-link" aria-label="Goto page 45">45</a>
    </li>
    <li>
      <a
        class="pagination-link is-current"
        aria-label="Page 46"
        aria-current="page"
        >46</a
      >
    </li>
    <li>
      <a href="#" class="pagination-link" aria-label="Goto page 47">47</a>
    </li>
    <li>
      <span class="pagination-ellipsis">&hellip;</span>
    </li>
    <li>
      <a href="#" class="pagination-link" aria-label="Goto page 86">86</a>
    </li>
  </ul>
</nav>

You can disable some links if they are not active, or change the amount of page numbers available.

Example

HTML

<nav class="pagination" role="navigation" aria-label="pagination">
  <a class="pagination-previous is-disabled" title="This is the first page"
    >Previous</a
  >
  <a href="#" class="pagination-next">Next page</a>
  <ul class="pagination-list">
    <li>
      <a
        class="pagination-link is-current"
        aria-label="Page 1"
        aria-current="page"
        >1</a
      >
    </li>
    <li>
      <a href="#" class="pagination-link" aria-label="Goto page 2">2</a>
    </li>
    <li>
      <a href="#" class="pagination-link" aria-label="Goto page 3">3</a>
    </li>
  </ul>
</nav>

By default on tablet, the list is located on the left, and the previous/next buttons on the right. But you can change the order of these elements by using the is-centered and is-right modifiers.

Example

HTML

<nav class="pagination is-centered" role="navigation" aria-label="pagination">
  <a href="#" class="pagination-previous">Previous</a>
  <a href="#" class="pagination-next">Next page</a>
  <ul class="pagination-list">
    <li><a href="#" class="pagination-link" aria-label="Goto page 1">1</a></li>
    <li><span class="pagination-ellipsis">&hellip;</span></li>
    <li><a href="#" class="pagination-link" aria-label="Goto page 45">45</a></li>
    <li>
      <a
        class="pagination-link is-current"
        aria-label="Page 46"
        aria-current="page"
        >46</a
      >
    </li>
    <li><a href="#" class="pagination-link" aria-label="Goto page 47">47</a></li>
    <li><span class="pagination-ellipsis">&hellip;</span></li>
    <li><a href="#" class="pagination-link" aria-label="Goto page 86">86</a></li>
  </ul>
</nav>

Example

HTML

<nav class="pagination is-right" role="navigation" aria-label="pagination">
  <a href="#" class="pagination-previous">Previous</a>
  <a href="#" class="pagination-next">Next page</a>
  <ul class="pagination-list">
    <li><a href="#" class="pagination-link" aria-label="Goto page 1">1</a></li>
    <li><span class="pagination-ellipsis">&hellip;</span></li>
    <li><a href="#" class="pagination-link" aria-label="Goto page 45">45</a></li>
    <li>
      <a
        class="pagination-link is-current"
        aria-label="Page 46"
        aria-current="page"
        >46</a
      >
    </li>
    <li><a href="#" class="pagination-link" aria-label="Goto page 47">47</a></li>
    <li><span class="pagination-ellipsis">&hellip;</span></li>
    <li><a href="#" class="pagination-link" aria-label="Goto page 86">86</a></li>
  </ul>
</nav>

Styles
#

Add the is-rounded modifier to have rounded pagination items.

Example

HTML

<nav class="pagination is-rounded" role="navigation" aria-label="pagination">
  <a href="#" class="pagination-previous">Previous</a>
  <a href="#" class="pagination-next">Next page</a>
  <ul class="pagination-list">
    <li><a href="#" class="pagination-link" aria-label="Goto page 1">1</a></li>
    <li><span class="pagination-ellipsis">&hellip;</span></li>
    <li><a href="#" class="pagination-link" aria-label="Goto page 45">45</a></li>
    <li>
      <a
        class="pagination-link is-current"
        aria-label="Page 46"
        aria-current="page"
        >46</a
      >
    </li>
    <li><a href="#" class="pagination-link" aria-label="Goto page 47">47</a></li>
    <li><span class="pagination-ellipsis">&hellip;</span></li>
    <li><a href="#" class="pagination-link" aria-label="Goto page 86">86</a></li>
  </ul>
</nav>

Sizes
#

The pagination comes in 3 additional sizes.
You only need to append the modifier is-small, is-medium, or is-large to the pagination component.

Example

HTML

<nav class="pagination is-small" role="navigation" aria-label="pagination">
  <a href="#" class="pagination-previous">Previous</a>
  <a href="#" class="pagination-next">Next page</a>
  <ul class="pagination-list">
    <li><a href="#" class="pagination-link" aria-label="Goto page 1">1</a></li>
    <li><span class="pagination-ellipsis">&hellip;</span></li>
    <li><a href="#" class="pagination-link" aria-label="Goto page 45">45</a></li>
    <li>
      <a
        class="pagination-link is-current"
        aria-label="Page 46"
        aria-current="page"
        >46</a
      >
    </li>
    <li><a href="#" class="pagination-link" aria-label="Goto page 47">47</a></li>
    <li><span class="pagination-ellipsis">&hellip;</span></li>
    <li><a href="#" class="pagination-link" aria-label="Goto page 86">86</a></li>
  </ul>
</nav>

Example

HTML

<nav class="pagination is-medium" role="navigation" aria-label="pagination">
  <a href="#" class="pagination-previous">Previous</a>
  <a href="#" class="pagination-next">Next page</a>
  <ul class="pagination-list">
    <li><a href="#" class="pagination-link" aria-label="Goto page 1">1</a></li>
    <li><span class="pagination-ellipsis">&hellip;</span></li>
    <li><a href="#" class="pagination-link" aria-label="Goto page 45">45</a></li>
    <li>
      <a
        class="pagination-link is-current"
        aria-label="Page 46"
        aria-current="page"
        >46</a
      >
    </li>
    <li><a href="#" class="pagination-link" aria-label="Goto page 47">47</a></li>
    <li><span class="pagination-ellipsis">&hellip;</span></li>
    <li><a href="#" class="pagination-link" aria-label="Goto page 86">86</a></li>
  </ul>
</nav>

Example

HTML

<nav class="pagination is-large" role="navigation" aria-label="pagination">
  <a href="#" class="pagination-previous">Previous</a>
  <a href="#" class="pagination-next">Next page</a>
  <ul class="pagination-list">
    <li><a href="#" class="pagination-link" aria-label="Goto page 1">1</a></li>
    <li><span class="pagination-ellipsis">&hellip;</span></li>
    <li><a href="#" class="pagination-link" aria-label="Goto page 45">45</a></li>
    <li>
      <a
        class="pagination-link is-current"
        aria-label="Page 46"
        aria-current="page"
        >46</a
      >
    </li>
    <li><a href="#" class="pagination-link" aria-label="Goto page 47">47</a></li>
    <li><span class="pagination-ellipsis">&hellip;</span></li>
    <li><a href="#" class="pagination-link" aria-label="Goto page 86">86</a></li>
  </ul>
</nav>

Sass and CSS variables
#
Sass Variable
	
CSS Variable
	
Value

$pagination-margin

var(--bulma-pagination-margin)

-0.25rem

$pagination-min-width

var(--bulma-pagination-min-width)

var(--bulma-control-height)

$pagination-item-border-style

var(--bulma-pagination-item-border-style)

solid

$pagination-item-border-width

var(--bulma-pagination-item-border-width)

var(--bulma-control-border-width)

$pagination-item-font-size

var(--bulma-pagination-item-font-size)

1em

$pagination-item-margin

var(--bulma-pagination-item-margin)

0.25rem

$pagination-item-padding-left

var(--bulma-pagination-item-padding-left)

0.5em

$pagination-item-padding-right

var(--bulma-pagination-item-padding-right)

0.5em

$pagination-nav-padding-left

var(--bulma-pagination-nav-padding-left)

0.75em

$pagination-nav-padding-right

var(--bulma-pagination-nav-padding-right)

0.75em

$pagination-disabled-color

var(--bulma-pagination-disabled-color)

var(--bulma-text-weak)

$pagination-disabled-background-color

var(--bulma-pagination-disabled-background-color)

var(--bulma-border)

$pagination-disabled-border-color

var(--bulma-pagination-disabled-border-color)

var(--bulma-border)

$pagination-current-color

var(--bulma-pagination-current-color)

var(--bulma-link-invert)

$pagination-current-background-color

var(--bulma-pagination-current-background-color)

var(--bulma-link)

$pagination-current-border-color

var(--bulma-pagination-current-border-color)

var(--bulma-link)

$pagination-ellipsis-color

var(--bulma-pagination-ellipsis-color)

var(--bulma-text-weak)

$pagination-shadow-inset

var(--bulma-pagination-shadow-inset)

inset 0 0.0625em 0.125em hsla(
  var(--bulma-scheme-h),
  var(--bulma-scheme-s),
  var(--bulma-scheme-invert-l),
  0.2
)



Navbar

A responsive horizontal navbar that can support images, links, buttons, and dropdowns
CSS Masterclass

The navbar component is a responsive and versatile horizontal navigation bar with the following structure:

    navbar the main container
        navbar-brand the left side, always visible, which usually contains the logo and optionally some links or icons
            navbar-burger the hamburger icon, which toggles the navbar menu on touch devices
        navbar-menu the right side, hidden on touch devices, visible on desktop
            navbar-start the left part of the menu, which appears next to the navbar brand on desktop
            navbar-end the right part of the menu, which appears at the end of the navbar
                navbar-item each single item of the navbar, which can either be an a or a div
                    navbar-link a link as the sibling of a dropdown, with an arrow
                    navbar-dropdown the dropdown menu, which can include navbar items and dividers
                        navbar-divider a horizontal line to separate navbar items

Basic Navbar
#

To get started quickly, here is what a complete basic navbar looks like:
Home
Documentation
More

<nav class="navbar" role="navigation" aria-label="main navigation">
  <div class="navbar-brand">
    <a class="navbar-item" href="https://bulma.io">
      <svg width="640" height="160" viewBox="0 0 640 160" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path fill-rule="evenodd" clip-rule="evenodd" d="M170 132.571V27.5908C170 25.5451 170.915 23.93 172.746 22.7456C174.576 21.5612 176.729 20.969 179.206 20.969H210.377C232.019 20.969 242.84 30.4441 242.84 49.3943C242.84 62.5303 238.264 71.0902 229.112 75.074C234.603 77.2275 238.748 80.2692 241.548 84.1992C244.347 88.1292 245.747 93.8627 245.747 101.4V104.791C245.747 116.743 242.84 125.437 237.026 130.875C231.211 136.312 223.351 139.031 213.445 139.031H179.206C176.514 139.031 174.307 138.385 172.584 137.093C170.861 135.801 170 134.293 170 132.571ZM190.834 120.619H209.085C219.529 120.619 224.751 114.751 224.751 103.015V100.431C224.751 94.401 223.432 90.0404 220.794 87.3486C218.156 84.6568 214.253 83.3109 209.085 83.3109H190.834V120.619ZM190.834 66.8371H208.923C213.122 66.8371 216.326 65.5989 218.533 63.1225C220.74 60.646 221.844 57.2544 221.844 52.9475C221.844 48.7483 220.686 45.4374 218.371 43.0148C216.057 40.5922 212.853 39.3809 208.762 39.3809H190.834V66.8371ZM260.283 103.015V27.4293C260.283 25.2759 261.306 23.6608 263.351 22.5841C265.397 21.5074 267.873 20.969 270.781 20.969C273.688 20.969 276.164 21.5074 278.21 22.5841C280.256 23.6608 281.279 25.2759 281.279 27.4293V103.015C281.279 115.397 287.2 121.588 299.044 121.588C310.888 121.588 316.81 115.397 316.81 103.015V27.4293C316.81 25.2759 317.833 23.6608 319.879 22.5841C321.925 21.5074 324.401 20.969 327.308 20.969C330.215 20.969 332.692 21.5074 334.738 22.5841C336.783 23.6608 337.806 25.2759 337.806 27.4293V103.015C337.806 115.72 334.28 125.061 327.227 131.036C320.175 137.012 310.781 140 299.044 140C287.308 140 277.914 137.039 270.861 131.117C263.809 125.195 260.283 115.828 260.283 103.015ZM356.703 132.409V27.4293C356.703 25.2759 357.725 23.6608 359.771 22.5841C361.817 21.5074 364.293 20.969 367.201 20.969C370.108 20.969 372.584 21.5074 374.63 22.5841C376.676 23.6608 377.699 25.2759 377.699 27.4293V120.619H417.106C419.044 120.619 420.579 121.534 421.709 123.365C422.84 125.195 423.405 127.349 423.405 129.825C423.405 132.301 422.84 134.455 421.709 136.285C420.579 138.116 419.044 139.031 417.106 139.031H365.908C363.432 139.031 361.279 138.439 359.448 137.254C357.618 136.07 356.703 134.455 356.703 132.409ZM434.872 132.409V31.467C434.872 27.9138 435.868 25.2759 437.86 23.5532C439.852 21.8304 442.355 20.969 445.37 20.969C449.354 20.969 452.423 21.6689 454.576 23.0686C456.729 24.4684 459.098 27.4832 461.682 32.1131L481.548 68.2907L501.413 32.1131C503.997 27.4832 506.393 24.4684 508.6 23.0686C510.808 21.6689 513.903 20.969 517.887 20.969C520.902 20.969 523.405 21.8304 525.397 23.5532C527.389 25.2759 528.385 27.9138 528.385 31.467V132.409C528.385 134.455 527.335 136.07 525.236 137.254C523.136 138.439 520.686 139.031 517.887 139.031C514.98 139.031 512.503 138.439 510.458 137.254C508.412 136.07 507.389 134.455 507.389 132.409V62.961L488.493 96.5545C486.985 99.354 484.616 100.754 481.386 100.754C478.264 100.754 475.949 99.354 474.441 96.5545L455.868 61.6689V132.409C455.868 134.455 454.818 136.07 452.719 137.254C450.619 138.439 448.17 139.031 445.37 139.031C442.463 139.031 439.987 138.439 437.941 137.254C435.895 136.07 434.872 134.455 434.872 132.409ZM539.529 130.31C539.529 130.094 539.637 129.556 539.852 128.694L571.023 27.1063C571.669 24.8452 573.257 23.0956 575.787 21.8573C578.318 20.6191 581.198 20 584.428 20C587.658 20 590.565 20.6191 593.149 21.8573C595.734 23.0956 597.349 24.8452 597.995 27.1063L629.166 128.694C629.381 129.556 629.489 130.094 629.489 130.31C629.489 132.678 628.035 134.724 625.128 136.447C622.221 138.17 619.26 139.031 616.245 139.031C612.261 139.031 609.892 137.631 609.139 134.832L603.001 113.351H566.016L559.879 134.832C559.125 137.631 556.756 139.031 552.773 139.031C549.65 139.031 546.662 138.197 543.809 136.528C540.956 134.859 539.529 132.786 539.529 130.31ZM570.377 96.8775H598.479L584.428 47.2948L570.377 96.8775Z" fill="black" class="bd-svg-black" />
  <path fill-rule="evenodd" clip-rule="evenodd" d="M0 110L10 40L50 0L100 50L70 80L110 120L50 160L0 110Z" fill="#00D1B2"/>
</svg>

    </a>

    <a role="button" class="navbar-burger" aria-label="menu" aria-expanded="false" data-target="navbarBasicExample">
      <span aria-hidden="true"></span>
      <span aria-hidden="true"></span>
      <span aria-hidden="true"></span>
      <span aria-hidden="true"></span>
    </a>
  </div>

  <div id="navbarBasicExample" class="navbar-menu">
    <div class="navbar-start">
      <a class="navbar-item">
        Home
      </a>

      <a class="navbar-item">
        Documentation
      </a>

      <div class="navbar-item has-dropdown is-hoverable">
        <a class="navbar-link">
          More
        </a>

        <div class="navbar-dropdown">
          <a class="navbar-item">
            About
          </a>
          <a class="navbar-item is-selected">
            Jobs
          </a>
          <a class="navbar-item">
            Contact
          </a>
          <hr class="navbar-divider">
          <a class="navbar-item">
            Report an issue
          </a>
        </div>
      </div>
    </div>

    <div class="navbar-end">
      <div class="navbar-item">
        <div class="buttons">
          <a class="button is-primary">
            <strong>Sign up</strong>
          </a>
          <a class="button is-light">
            Log in
          </a>
        </div>
      </div>
    </div>
  </div>
</nav>

Navbar brand
#

The navbar-brand is the left side of the navbar. It can contain:

    a number of navbar-item
    the navbar-burger as last child

<nav class="navbar" role="navigation" aria-label="main navigation">
  <div class="navbar-brand">
    <!-- navbar items, navbar burger... -->
  </div>
</nav>

The navbar brand is always visible: on both touch devices < 1024px and desktop >= 1024px . As a result, it is recommended to only use a few navbar items to avoid overflowing horizontally on small devices.

<nav class="navbar" role="navigation" aria-label="main navigation">
  <div class="navbar-brand">
    <a class="navbar-item" href="https://bulma.io">
      <svg width="640" height="160" viewBox="0 0 640 160" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path fill-rule="evenodd" clip-rule="evenodd" d="M170 132.571V27.5908C170 25.5451 170.915 23.93 172.746 22.7456C174.576 21.5612 176.729 20.969 179.206 20.969H210.377C232.019 20.969 242.84 30.4441 242.84 49.3943C242.84 62.5303 238.264 71.0902 229.112 75.074C234.603 77.2275 238.748 80.2692 241.548 84.1992C244.347 88.1292 245.747 93.8627 245.747 101.4V104.791C245.747 116.743 242.84 125.437 237.026 130.875C231.211 136.312 223.351 139.031 213.445 139.031H179.206C176.514 139.031 174.307 138.385 172.584 137.093C170.861 135.801 170 134.293 170 132.571ZM190.834 120.619H209.085C219.529 120.619 224.751 114.751 224.751 103.015V100.431C224.751 94.401 223.432 90.0404 220.794 87.3486C218.156 84.6568 214.253 83.3109 209.085 83.3109H190.834V120.619ZM190.834 66.8371H208.923C213.122 66.8371 216.326 65.5989 218.533 63.1225C220.74 60.646 221.844 57.2544 221.844 52.9475C221.844 48.7483 220.686 45.4374 218.371 43.0148C216.057 40.5922 212.853 39.3809 208.762 39.3809H190.834V66.8371ZM260.283 103.015V27.4293C260.283 25.2759 261.306 23.6608 263.351 22.5841C265.397 21.5074 267.873 20.969 270.781 20.969C273.688 20.969 276.164 21.5074 278.21 22.5841C280.256 23.6608 281.279 25.2759 281.279 27.4293V103.015C281.279 115.397 287.2 121.588 299.044 121.588C310.888 121.588 316.81 115.397 316.81 103.015V27.4293C316.81 25.2759 317.833 23.6608 319.879 22.5841C321.925 21.5074 324.401 20.969 327.308 20.969C330.215 20.969 332.692 21.5074 334.738 22.5841C336.783 23.6608 337.806 25.2759 337.806 27.4293V103.015C337.806 115.72 334.28 125.061 327.227 131.036C320.175 137.012 310.781 140 299.044 140C287.308 140 277.914 137.039 270.861 131.117C263.809 125.195 260.283 115.828 260.283 103.015ZM356.703 132.409V27.4293C356.703 25.2759 357.725 23.6608 359.771 22.5841C361.817 21.5074 364.293 20.969 367.201 20.969C370.108 20.969 372.584 21.5074 374.63 22.5841C376.676 23.6608 377.699 25.2759 377.699 27.4293V120.619H417.106C419.044 120.619 420.579 121.534 421.709 123.365C422.84 125.195 423.405 127.349 423.405 129.825C423.405 132.301 422.84 134.455 421.709 136.285C420.579 138.116 419.044 139.031 417.106 139.031H365.908C363.432 139.031 361.279 138.439 359.448 137.254C357.618 136.07 356.703 134.455 356.703 132.409ZM434.872 132.409V31.467C434.872 27.9138 435.868 25.2759 437.86 23.5532C439.852 21.8304 442.355 20.969 445.37 20.969C449.354 20.969 452.423 21.6689 454.576 23.0686C456.729 24.4684 459.098 27.4832 461.682 32.1131L481.548 68.2907L501.413 32.1131C503.997 27.4832 506.393 24.4684 508.6 23.0686C510.808 21.6689 513.903 20.969 517.887 20.969C520.902 20.969 523.405 21.8304 525.397 23.5532C527.389 25.2759 528.385 27.9138 528.385 31.467V132.409C528.385 134.455 527.335 136.07 525.236 137.254C523.136 138.439 520.686 139.031 517.887 139.031C514.98 139.031 512.503 138.439 510.458 137.254C508.412 136.07 507.389 134.455 507.389 132.409V62.961L488.493 96.5545C486.985 99.354 484.616 100.754 481.386 100.754C478.264 100.754 475.949 99.354 474.441 96.5545L455.868 61.6689V132.409C455.868 134.455 454.818 136.07 452.719 137.254C450.619 138.439 448.17 139.031 445.37 139.031C442.463 139.031 439.987 138.439 437.941 137.254C435.895 136.07 434.872 134.455 434.872 132.409ZM539.529 130.31C539.529 130.094 539.637 129.556 539.852 128.694L571.023 27.1063C571.669 24.8452 573.257 23.0956 575.787 21.8573C578.318 20.6191 581.198 20 584.428 20C587.658 20 590.565 20.6191 593.149 21.8573C595.734 23.0956 597.349 24.8452 597.995 27.1063L629.166 128.694C629.381 129.556 629.489 130.094 629.489 130.31C629.489 132.678 628.035 134.724 625.128 136.447C622.221 138.17 619.26 139.031 616.245 139.031C612.261 139.031 609.892 137.631 609.139 134.832L603.001 113.351H566.016L559.879 134.832C559.125 137.631 556.756 139.031 552.773 139.031C549.65 139.031 546.662 138.197 543.809 136.528C540.956 134.859 539.529 132.786 539.529 130.31ZM570.377 96.8775H598.479L584.428 47.2948L570.377 96.8775Z" fill="black" class="bd-svg-black" />
  <path fill-rule="evenodd" clip-rule="evenodd" d="M0 110L10 40L50 0L100 50L70 80L110 120L50 160L0 110Z" fill="#00D1B2"/>
</svg>

    </a>

    <a role="button" class="navbar-burger" aria-label="menu" aria-expanded="false">
      <span aria-hidden="true"></span>
      <span aria-hidden="true"></span>
      <span aria-hidden="true"></span>
      <span aria-hidden="true"></span>
    </a>
  </div>
</nav>

On desktop >= 1024px , the navbar brand will only take up the space it needs.
Navbar burger
#

The navbar-burger is a hamburger menu that only appears on touch devices. It has to appear as the last child of navbar-brand. It has to contain four empty span tags in order to visualize the hamburger lines or the cross (when active).

<a class="navbar-burger" role="button" aria-label="menu" aria-expanded="false">
  <span aria-hidden="true"></span>
  <span aria-hidden="true"></span>
  <span aria-hidden="true"></span>
  <span aria-hidden="true"></span>
</a>

You can add the modifier class is-active to turn it into a cross.

<a class="navbar-burger is-active" role="button" aria-label="menu" aria-expanded="false">
  <span aria-hidden="true"></span>
  <span aria-hidden="true"></span>
  <span aria-hidden="true"></span>
  <span aria-hidden="true"></span>
</a>

Navbar menu
#

The navbar-menu is the counterpart of the navbar brand. As such, it must appear as a direct child of navbar, as a sibling of navbar-brand.

<nav class="navbar" role="navigation" aria-label="main navigation">
  <div class="navbar-brand">
    <!-- navbar items, navbar burger... -->
  </div>
  <div class="navbar-menu">
    <!-- navbar start, navbar end -->
  </div>
</nav>

The navbar-menu is hidden on touch devices < 1024px . You need to add the modifier class is-active to display it.

<div class="navbar-menu">
  <!-- hidden on mobile -->
</div>

<div class="navbar-menu is-active">
  <!-- shown on mobile -->
</div>

On desktop >= 1024px , the navbar-menu will fill up the space available in the navbar, leaving the navbar brand just the space it needs. It needs, however, two elements as direct children:

    navbar-start
    navbar-end

Javascript toggle

The Bulma package does not come with any JavaScript.
Here is however an implementation example, which toggles the class is-active on both the navbar-burger and the targeted navbar-menu, in Vanilla Javascript.

<a role="button" class="navbar-burger" data-target="navMenu" aria-label="menu" aria-expanded="false">
  <span aria-hidden="true"></span>
  <span aria-hidden="true"></span>
  <span aria-hidden="true"></span>
  <span aria-hidden="true"></span>
</a>

<div class="navbar-menu" id="navMenu">
  <!-- navbar-start, navbar-end... -->
</div>

document.addEventListener('DOMContentLoaded', () => {

  // Get all "navbar-burger" elements
  const $navbarBurgers = Array.prototype.slice.call(document.querySelectorAll('.navbar-burger'), 0);

  // Add a click event on each of them
  $navbarBurgers.forEach( el => {
    el.addEventListener('click', () => {

      // Get the target from the "data-target" attribute
      const target = el.dataset.target;
      const $target = document.getElementById(target);

      // Toggle the "is-active" class on both the "navbar-burger" and the "navbar-menu"
      el.classList.toggle('is-active');
      $target.classList.toggle('is-active');

    });
  });

});

And here is another implementation example, which again toggles the class is-active on both the navbar-burger and the targeted navbar-menu, but this time in jQuery.

$(document).ready(function() {

  // Check for click events on the navbar burger icon
  $(".navbar-burger").click(function() {

      // Toggle the "is-active" class on both the "navbar-burger" and the "navbar-menu"
      $(".navbar-burger").toggleClass("is-active");
      $(".navbar-menu").toggleClass("is-active");

  });
});

Remember, these are just implementation examples. The Bulma package does not come with any JavaScript.
Navbar start and navbar end
#

The navbar-start and navbar-end are the two direct and only children of the navbar-menu.

On desktop >= 1024px :

    navbar-start will appear on the left
    navbar-end will appear on the right

Each of them can contain any number of navbar-item.

<div class="navbar-menu">
  <div class="navbar-start">
    <!-- navbar items -->
  </div>

  <div class="navbar-end">
    <!-- navbar items -->
  </div>
</div>

Navbar item
#

A navbar-item is a repeatable element that can be:

    a navigation link

    <a class="navbar-item">
      Home
    </a>

a container for the brand logo

<a class="navbar-item">
  <svg width="640" height="160" viewBox="0 0 640 160" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path fill-rule="evenodd" clip-rule="evenodd" d="M170 132.571V27.5908C170 25.5451 170.915 23.93 172.746 22.7456C174.576 21.5612 176.729 20.969 179.206 20.969H210.377C232.019 20.969 242.84 30.4441 242.84 49.3943C242.84 62.5303 238.264 71.0902 229.112 75.074C234.603 77.2275 238.748 80.2692 241.548 84.1992C244.347 88.1292 245.747 93.8627 245.747 101.4V104.791C245.747 116.743 242.84 125.437 237.026 130.875C231.211 136.312 223.351 139.031 213.445 139.031H179.206C176.514 139.031 174.307 138.385 172.584 137.093C170.861 135.801 170 134.293 170 132.571ZM190.834 120.619H209.085C219.529 120.619 224.751 114.751 224.751 103.015V100.431C224.751 94.401 223.432 90.0404 220.794 87.3486C218.156 84.6568 214.253 83.3109 209.085 83.3109H190.834V120.619ZM190.834 66.8371H208.923C213.122 66.8371 216.326 65.5989 218.533 63.1225C220.74 60.646 221.844 57.2544 221.844 52.9475C221.844 48.7483 220.686 45.4374 218.371 43.0148C216.057 40.5922 212.853 39.3809 208.762 39.3809H190.834V66.8371ZM260.283 103.015V27.4293C260.283 25.2759 261.306 23.6608 263.351 22.5841C265.397 21.5074 267.873 20.969 270.781 20.969C273.688 20.969 276.164 21.5074 278.21 22.5841C280.256 23.6608 281.279 25.2759 281.279 27.4293V103.015C281.279 115.397 287.2 121.588 299.044 121.588C310.888 121.588 316.81 115.397 316.81 103.015V27.4293C316.81 25.2759 317.833 23.6608 319.879 22.5841C321.925 21.5074 324.401 20.969 327.308 20.969C330.215 20.969 332.692 21.5074 334.738 22.5841C336.783 23.6608 337.806 25.2759 337.806 27.4293V103.015C337.806 115.72 334.28 125.061 327.227 131.036C320.175 137.012 310.781 140 299.044 140C287.308 140 277.914 137.039 270.861 131.117C263.809 125.195 260.283 115.828 260.283 103.015ZM356.703 132.409V27.4293C356.703 25.2759 357.725 23.6608 359.771 22.5841C361.817 21.5074 364.293 20.969 367.201 20.969C370.108 20.969 372.584 21.5074 374.63 22.5841C376.676 23.6608 377.699 25.2759 377.699 27.4293V120.619H417.106C419.044 120.619 420.579 121.534 421.709 123.365C422.84 125.195 423.405 127.349 423.405 129.825C423.405 132.301 422.84 134.455 421.709 136.285C420.579 138.116 419.044 139.031 417.106 139.031H365.908C363.432 139.031 361.279 138.439 359.448 137.254C357.618 136.07 356.703 134.455 356.703 132.409ZM434.872 132.409V31.467C434.872 27.9138 435.868 25.2759 437.86 23.5532C439.852 21.8304 442.355 20.969 445.37 20.969C449.354 20.969 452.423 21.6689 454.576 23.0686C456.729 24.4684 459.098 27.4832 461.682 32.1131L481.548 68.2907L501.413 32.1131C503.997 27.4832 506.393 24.4684 508.6 23.0686C510.808 21.6689 513.903 20.969 517.887 20.969C520.902 20.969 523.405 21.8304 525.397 23.5532C527.389 25.2759 528.385 27.9138 528.385 31.467V132.409C528.385 134.455 527.335 136.07 525.236 137.254C523.136 138.439 520.686 139.031 517.887 139.031C514.98 139.031 512.503 138.439 510.458 137.254C508.412 136.07 507.389 134.455 507.389 132.409V62.961L488.493 96.5545C486.985 99.354 484.616 100.754 481.386 100.754C478.264 100.754 475.949 99.354 474.441 96.5545L455.868 61.6689V132.409C455.868 134.455 454.818 136.07 452.719 137.254C450.619 138.439 448.17 139.031 445.37 139.031C442.463 139.031 439.987 138.439 437.941 137.254C435.895 136.07 434.872 134.455 434.872 132.409ZM539.529 130.31C539.529 130.094 539.637 129.556 539.852 128.694L571.023 27.1063C571.669 24.8452 573.257 23.0956 575.787 21.8573C578.318 20.6191 581.198 20 584.428 20C587.658 20 590.565 20.6191 593.149 21.8573C595.734 23.0956 597.349 24.8452 597.995 27.1063L629.166 128.694C629.381 129.556 629.489 130.094 629.489 130.31C629.489 132.678 628.035 134.724 625.128 136.447C622.221 138.17 619.26 139.031 616.245 139.031C612.261 139.031 609.892 137.631 609.139 134.832L603.001 113.351H566.016L559.879 134.832C559.125 137.631 556.756 139.031 552.773 139.031C549.65 139.031 546.662 138.197 543.809 136.528C540.956 134.859 539.529 132.786 539.529 130.31ZM570.377 96.8775H598.479L584.428 47.2948L570.377 96.8775Z" fill="black" class="bd-svg-black" />
  <path fill-rule="evenodd" clip-rule="evenodd" d="M0 110L10 40L50 0L100 50L70 80L110 120L50 160L0 110Z" fill="#00D1B2"/>
</svg>

</a>

the parent of a dropdown menu

<div class="navbar-item has-dropdown">
  <a class="navbar-link">
    Docs
  </a>

  <div class="navbar-dropdown">
    <!-- Other navbar items -->
  </div>
</div>

a child of a navbar dropdown

<div class="navbar-dropdown">
  <a class="navbar-item">
    Overview
  </a>
</div>

a container for almost anything you want, like a field

<div class="navbar-item">
  <div class="field is-grouped">
    <p class="control">
      <a class="button">
        <span class="icon">
          <i class="fas fa-twitter" aria-hidden="true"></i>
        </span>
        <span>Tweet</span>
      </a>
    </p>
    <p class="control">
      <a class="button is-primary">
        <span class="icon">
          <i class="fas fa-download" aria-hidden="true"></i>
        </span>
        <span>Download</span>
      </a>
    </p>
  </div>
</div>

It can either be an anchor tag <a> or a <div>, as a direct child of either:

    navbar
    navbar-brand
    navbar-start
    navbar-end
    navbar-dropdown

You can add the following modifier classes:

    is-expanded to turn it into a full-width element
    is-tab to add a bottom border on hover and show the bottom border using is-active

Transparent navbar
#

To seamlessly integrate the navbar in any visual context, you can add the is-transparent modifier on the navbar component. This will remove any hover or active background from the navbar items.

Example
Home
Docs
Overview
Modifiers
Columns
Layout
Form
Elements
Components

HTML

<nav class="navbar is-transparent">
  <div class="navbar-brand">
    <a class="navbar-item" href="https://bulma.io">
      <svg width="640" height="160" viewBox="0 0 640 160" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path fill-rule="evenodd" clip-rule="evenodd" d="M170 132.571V27.5908C170 25.5451 170.915 23.93 172.746 22.7456C174.576 21.5612 176.729 20.969 179.206 20.969H210.377C232.019 20.969 242.84 30.4441 242.84 49.3943C242.84 62.5303 238.264 71.0902 229.112 75.074C234.603 77.2275 238.748 80.2692 241.548 84.1992C244.347 88.1292 245.747 93.8627 245.747 101.4V104.791C245.747 116.743 242.84 125.437 237.026 130.875C231.211 136.312 223.351 139.031 213.445 139.031H179.206C176.514 139.031 174.307 138.385 172.584 137.093C170.861 135.801 170 134.293 170 132.571ZM190.834 120.619H209.085C219.529 120.619 224.751 114.751 224.751 103.015V100.431C224.751 94.401 223.432 90.0404 220.794 87.3486C218.156 84.6568 214.253 83.3109 209.085 83.3109H190.834V120.619ZM190.834 66.8371H208.923C213.122 66.8371 216.326 65.5989 218.533 63.1225C220.74 60.646 221.844 57.2544 221.844 52.9475C221.844 48.7483 220.686 45.4374 218.371 43.0148C216.057 40.5922 212.853 39.3809 208.762 39.3809H190.834V66.8371ZM260.283 103.015V27.4293C260.283 25.2759 261.306 23.6608 263.351 22.5841C265.397 21.5074 267.873 20.969 270.781 20.969C273.688 20.969 276.164 21.5074 278.21 22.5841C280.256 23.6608 281.279 25.2759 281.279 27.4293V103.015C281.279 115.397 287.2 121.588 299.044 121.588C310.888 121.588 316.81 115.397 316.81 103.015V27.4293C316.81 25.2759 317.833 23.6608 319.879 22.5841C321.925 21.5074 324.401 20.969 327.308 20.969C330.215 20.969 332.692 21.5074 334.738 22.5841C336.783 23.6608 337.806 25.2759 337.806 27.4293V103.015C337.806 115.72 334.28 125.061 327.227 131.036C320.175 137.012 310.781 140 299.044 140C287.308 140 277.914 137.039 270.861 131.117C263.809 125.195 260.283 115.828 260.283 103.015ZM356.703 132.409V27.4293C356.703 25.2759 357.725 23.6608 359.771 22.5841C361.817 21.5074 364.293 20.969 367.201 20.969C370.108 20.969 372.584 21.5074 374.63 22.5841C376.676 23.6608 377.699 25.2759 377.699 27.4293V120.619H417.106C419.044 120.619 420.579 121.534 421.709 123.365C422.84 125.195 423.405 127.349 423.405 129.825C423.405 132.301 422.84 134.455 421.709 136.285C420.579 138.116 419.044 139.031 417.106 139.031H365.908C363.432 139.031 361.279 138.439 359.448 137.254C357.618 136.07 356.703 134.455 356.703 132.409ZM434.872 132.409V31.467C434.872 27.9138 435.868 25.2759 437.86 23.5532C439.852 21.8304 442.355 20.969 445.37 20.969C449.354 20.969 452.423 21.6689 454.576 23.0686C456.729 24.4684 459.098 27.4832 461.682 32.1131L481.548 68.2907L501.413 32.1131C503.997 27.4832 506.393 24.4684 508.6 23.0686C510.808 21.6689 513.903 20.969 517.887 20.969C520.902 20.969 523.405 21.8304 525.397 23.5532C527.389 25.2759 528.385 27.9138 528.385 31.467V132.409C528.385 134.455 527.335 136.07 525.236 137.254C523.136 138.439 520.686 139.031 517.887 139.031C514.98 139.031 512.503 138.439 510.458 137.254C508.412 136.07 507.389 134.455 507.389 132.409V62.961L488.493 96.5545C486.985 99.354 484.616 100.754 481.386 100.754C478.264 100.754 475.949 99.354 474.441 96.5545L455.868 61.6689V132.409C455.868 134.455 454.818 136.07 452.719 137.254C450.619 138.439 448.17 139.031 445.37 139.031C442.463 139.031 439.987 138.439 437.941 137.254C435.895 136.07 434.872 134.455 434.872 132.409ZM539.529 130.31C539.529 130.094 539.637 129.556 539.852 128.694L571.023 27.1063C571.669 24.8452 573.257 23.0956 575.787 21.8573C578.318 20.6191 581.198 20 584.428 20C587.658 20 590.565 20.6191 593.149 21.8573C595.734 23.0956 597.349 24.8452 597.995 27.1063L629.166 128.694C629.381 129.556 629.489 130.094 629.489 130.31C629.489 132.678 628.035 134.724 625.128 136.447C622.221 138.17 619.26 139.031 616.245 139.031C612.261 139.031 609.892 137.631 609.139 134.832L603.001 113.351H566.016L559.879 134.832C559.125 137.631 556.756 139.031 552.773 139.031C549.65 139.031 546.662 138.197 543.809 136.528C540.956 134.859 539.529 132.786 539.529 130.31ZM570.377 96.8775H598.479L584.428 47.2948L570.377 96.8775Z" fill="black" class="bd-svg-black" />
  <path fill-rule="evenodd" clip-rule="evenodd" d="M0 110L10 40L50 0L100 50L70 80L110 120L50 160L0 110Z" fill="#00D1B2"/>
</svg>

    </a>
    <div class="navbar-burger js-burger" data-target="navbarExampleTransparentExample">
      <span></span>
      <span></span>
      <span></span>
      <span></span>
    </div>
  </div>

  <div id="navbarExampleTransparentExample" class="navbar-menu">
    <div class="navbar-start">
      <a class="navbar-item" href="https://bulma.io/"> Home </a>
      <div class="navbar-item has-dropdown is-active">
        <a class="navbar-link" href="https://bulma.io/documentation/overview/start/"> Docs </a>
        <div class="navbar-dropdown is-boxed">
          <a class="navbar-item" href="https://bulma.io/documentation/overview/start/"> Overview </a>
          <a class="navbar-item" href="https://bulma.io/documentation/overview/modifiers/"> Modifiers </a>
          <hr class="navbar-divider">
          <a class="navbar-item" href="https://bulma.io/documentation/columns/basics/"> Columns </a>
          <a class="navbar-item is-selected" href="https://bulma.io/documentation/layout/container/"> Layout </a>
          <a class="navbar-item" href="https://bulma.io/documentation/form/general/"> Form </a>
          <a class="navbar-item" href="https://bulma.io/documentation/elements/box/"> Elements </a>
          <a class="navbar-item" href="https://bulma.io/documentation/components/breadcrumb/"> Components </a>
        </div>
      </div>
    </div>

    <div class="navbar-end">
      <div class="navbar-item">
        <div class="field is-grouped">
          <p class="control">
            <a
              class="bd-tw-button button"
              data-social-network="Twitter"
              data-social-action="tweet"
              data-social-target="https://bulma.io"
              target="_blank"
              href="https://twitter.com/intent/tweet?text=Bulma: a modern CSS framework based on Flexbox&amp;hashtags=bulmaio&amp;url=https://bulma.io&amp;via=jgthms"
            >
              <span class="icon">
                <i class="fab fa-twitter"></i>
              </span>
              <span> Tweet </span>
            </a>
          </p>
          <p class="control">
            <a class="button is-primary" href="https://github.com/jgthms/bulma/releases/download/1.0.4/bulma-1.0.4.zip">
              <span class="icon">
                <i class="fas fa-download"></i>
              </span>
              <span>Download</span>
            </a>
          </p>
        </div>
      </div>
    </div>
  </div>
</nav>

Fixed navbar
#

You can now fix the navbar to either the top or bottom of the page. This is a 2-step process:

    Add either is-fixed-top or is-fixed-bottom to the navbar component

    <nav class="navbar is-fixed-top">

Add the corresponding has-navbar-fixed-top or has-navbar-fixed-bottom modifier to either <html> or <body> element to provide the appropriate padding to the page

<html class="has-navbar-fixed-top">

Try it out!
Dropdown menu
#

To create a dropdown menu, you will need 4 elements:

    navbar-item with the has-dropdown modifier
    navbar-link which contains the dropdown arrow
    navbar-dropdown which can contain instances of navbar-item and navbar-divider

Docs

<nav class="navbar" role="navigation" aria-label="dropdown navigation">
  <div class="navbar-item has-dropdown">
    <a class="navbar-link">
      Docs
    </a>

    <div class="navbar-dropdown">
      <a class="navbar-item">
        Overview
      </a>
      <a class="navbar-item">
        Elements
      </a>
      <a class="navbar-item">
        Components
      </a>
      <hr class="navbar-divider">
      <div class="navbar-item">
        Version 1.0.4
      </div>
    </div>
  </div>
</nav>

Show/hide the dropdown with either CSS or JavaScript

The navbar-dropdown is visible on touch devices < 1024px but hidden on desktop >= 1024px . How the dropdown is displayed on desktop depends on the parent's class.

The navbar-item with the has-dropdown modifier, has 2 additional modifiers

    is-hoverable: the dropdown will show up when hovering the parent navbar-item
    is-active: the dropdown will show up all the time

While the CSS :hover implementation works perfectly, the is-active class is available for users who want to control the display of the dropdown with JavaScript.

<div class="navbar-item has-dropdown is-hoverable">
  <!-- navbar-link, navbar-dropdown etc. -->
</div>

Docs

<nav class="navbar" role="navigation" aria-label="dropdown navigation">
  <div class="navbar-item has-dropdown is-hoverable">
    <a class="navbar-link">
      Docs
    </a>

    <div class="navbar-dropdown">
      <a class="navbar-item">
        Overview
      </a>
      <a class="navbar-item">
        Elements
      </a>
      <a class="navbar-item">
        Components
      </a>
      <hr class="navbar-divider">
      <div class="navbar-item">
        Version 1.0.4
      </div>
    </div>
  </div>
</nav>

<div class="navbar-item has-dropdown is-active">
  <!-- navbar-link, navbar-dropdown etc. -->
</div>

Docs
Overview
Elements
Components
Version 1.0.4

<nav class="navbar" role="navigation" aria-label="dropdown navigation">
  <div class="navbar-item has-dropdown is-active">
    <a class="navbar-link">
      Docs
    </a>

    <div class="navbar-dropdown">
      <a class="navbar-item">
        Overview
      </a>
      <a class="navbar-item">
        Elements
      </a>
      <a class="navbar-item">
        Components
      </a>
      <hr class="navbar-divider">
      <div class="navbar-item">
        Version 1.0.4
      </div>
    </div>
  </div>
</nav>

Right dropdown

If your parent navbar-item is on the right side, you can position the dropdown to start from the right with the is-right modifier.

<div class="navbar-dropdown is-right">
  <!-- navbar-item, navbar-divider etc. -->
</div>

Left
Overview
Elements
Components
Version 1.0.4
Right
Overview
Elements
Components
Version 1.0.4

Documentation

Everything you need to create a website with Bulma

<nav class="navbar" role="navigation" aria-label="dropdown navigation">
  <div class="navbar-menu">
    <div class="navbar-start">
      <div class="navbar-item has-dropdown is-active">
        <a class="navbar-link">
          Left
        </a>

        <div class="navbar-dropdown">
          <a class="navbar-item">
            Overview
          </a>
          <a class="navbar-item">
            Elements
          </a>
          <a class="navbar-item">
            Components
          </a>
          <hr class="navbar-divider">
          <div class="navbar-item">
            Version 1.0.4
          </div>
        </div>
      </div>
    </div>

    <div class="navbar-end">
      <div class="navbar-item has-dropdown is-active">
        <a class="navbar-link">
          Right
        </a>

        <div class="navbar-dropdown is-right">
          <a class="navbar-item">
            Overview
          </a>
          <a class="navbar-item">
            Elements
          </a>
          <a class="navbar-item">
            Components
          </a>
          <hr class="navbar-divider">
          <div class="navbar-item">
            Version 1.0.4
          </div>
        </div>
      </div>
    </div>
  </div>
</nav>

<section class="hero is-primary">
  <div class="hero-body">
    <p class="title">
      Documentation
    </p>
    <p class="subtitle">
      Everything you need to <strong>create a website</strong> with Bulma
    </p>
  </div>
</section>

Dropup

If you're using a navbar at the bottom, like the fixed bottom navbar, you might want to use a dropup menu. Simply add the has-dropdown and has-dropdown-up modifiers to the parent navbar-item.

<div class="navbar-item has-dropdown has-dropdown-up is-hoverable">
  <a class="navbar-link" href="https://bulma.io/documentation/overview/start/">
    Docs
  </a>
  <div class="navbar-dropdown">
    <a class="navbar-item" href="https://bulma.io/documentation/overview/start/">
      Overview
    </a>
  </div>
</div>

Documentation

Everything you need to create a website with Bulma
Dropup
Overview
Elements
Components
Version 1.0.4

<section class="hero is-primary">
  <div class="hero-body">
    <p class="title">
      Documentation
    </p>
    <p class="subtitle">
      Everything you need to <strong>create a website</strong> with Bulma
    </p>
  </div>
</section>

<nav class="navbar" role="navigation" aria-label="dropdown navigation">
  <div class="navbar-menu">
    <div class="navbar-start">
      <div class="navbar-item has-dropdown has-dropdown-up is-active">
        <a class="navbar-link">
          Dropup
        </a>

        <div class="navbar-dropdown">
          <a class="navbar-item">
            Overview
          </a>
          <a class="navbar-item">
            Elements
          </a>
          <a class="navbar-item">
            Components
          </a>
          <hr class="navbar-divider">
          <div class="navbar-item">
            Version 1.0.4
          </div>
        </div>
      </div>
    </div>
  </div>
</nav>

Dropdown without arrow

You can remove the arrow in the items of the navbar by adding the is-arrowless modifier to them.

<div class="navbar-item has-dropdown is-hoverable">
  <a class="navbar-link is-arrowless">
    Docs
  </a>
  <!-- navbar-dropdowns -->
</div>

Link without arrow

<div class="navbar-item has-dropdown is-hoverable">
  <a class="navbar-link is-arrowless">
    Link without arrow
  </a>
  <div class="navbar-dropdown">
    <a class="navbar-item">
      Overview
    </a>
    <a class="navbar-item">
      Elements
    </a>
    <a class="navbar-item">
      Components
    </a>
    <hr class="navbar-divider">
    <div class="navbar-item">
      Version 1.0.4
    </div>
  </div>
</div>

Styles for the dropdown menu

By default, the navbar-dropdown has:

    a grey border-top
    a border-radius at both bottom corners

Docs
Overview
Elements
Components
Version 1.0.4

Documentation

Everything you need to create a website with Bulma

<nav class="navbar" role="navigation" aria-label="dropdown navigation">
  <a class="navbar-item">
    <svg width="640" height="160" viewBox="0 0 640 160" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path fill-rule="evenodd" clip-rule="evenodd" d="M170 132.571V27.5908C170 25.5451 170.915 23.93 172.746 22.7456C174.576 21.5612 176.729 20.969 179.206 20.969H210.377C232.019 20.969 242.84 30.4441 242.84 49.3943C242.84 62.5303 238.264 71.0902 229.112 75.074C234.603 77.2275 238.748 80.2692 241.548 84.1992C244.347 88.1292 245.747 93.8627 245.747 101.4V104.791C245.747 116.743 242.84 125.437 237.026 130.875C231.211 136.312 223.351 139.031 213.445 139.031H179.206C176.514 139.031 174.307 138.385 172.584 137.093C170.861 135.801 170 134.293 170 132.571ZM190.834 120.619H209.085C219.529 120.619 224.751 114.751 224.751 103.015V100.431C224.751 94.401 223.432 90.0404 220.794 87.3486C218.156 84.6568 214.253 83.3109 209.085 83.3109H190.834V120.619ZM190.834 66.8371H208.923C213.122 66.8371 216.326 65.5989 218.533 63.1225C220.74 60.646 221.844 57.2544 221.844 52.9475C221.844 48.7483 220.686 45.4374 218.371 43.0148C216.057 40.5922 212.853 39.3809 208.762 39.3809H190.834V66.8371ZM260.283 103.015V27.4293C260.283 25.2759 261.306 23.6608 263.351 22.5841C265.397 21.5074 267.873 20.969 270.781 20.969C273.688 20.969 276.164 21.5074 278.21 22.5841C280.256 23.6608 281.279 25.2759 281.279 27.4293V103.015C281.279 115.397 287.2 121.588 299.044 121.588C310.888 121.588 316.81 115.397 316.81 103.015V27.4293C316.81 25.2759 317.833 23.6608 319.879 22.5841C321.925 21.5074 324.401 20.969 327.308 20.969C330.215 20.969 332.692 21.5074 334.738 22.5841C336.783 23.6608 337.806 25.2759 337.806 27.4293V103.015C337.806 115.72 334.28 125.061 327.227 131.036C320.175 137.012 310.781 140 299.044 140C287.308 140 277.914 137.039 270.861 131.117C263.809 125.195 260.283 115.828 260.283 103.015ZM356.703 132.409V27.4293C356.703 25.2759 357.725 23.6608 359.771 22.5841C361.817 21.5074 364.293 20.969 367.201 20.969C370.108 20.969 372.584 21.5074 374.63 22.5841C376.676 23.6608 377.699 25.2759 377.699 27.4293V120.619H417.106C419.044 120.619 420.579 121.534 421.709 123.365C422.84 125.195 423.405 127.349 423.405 129.825C423.405 132.301 422.84 134.455 421.709 136.285C420.579 138.116 419.044 139.031 417.106 139.031H365.908C363.432 139.031 361.279 138.439 359.448 137.254C357.618 136.07 356.703 134.455 356.703 132.409ZM434.872 132.409V31.467C434.872 27.9138 435.868 25.2759 437.86 23.5532C439.852 21.8304 442.355 20.969 445.37 20.969C449.354 20.969 452.423 21.6689 454.576 23.0686C456.729 24.4684 459.098 27.4832 461.682 32.1131L481.548 68.2907L501.413 32.1131C503.997 27.4832 506.393 24.4684 508.6 23.0686C510.808 21.6689 513.903 20.969 517.887 20.969C520.902 20.969 523.405 21.8304 525.397 23.5532C527.389 25.2759 528.385 27.9138 528.385 31.467V132.409C528.385 134.455 527.335 136.07 525.236 137.254C523.136 138.439 520.686 139.031 517.887 139.031C514.98 139.031 512.503 138.439 510.458 137.254C508.412 136.07 507.389 134.455 507.389 132.409V62.961L488.493 96.5545C486.985 99.354 484.616 100.754 481.386 100.754C478.264 100.754 475.949 99.354 474.441 96.5545L455.868 61.6689V132.409C455.868 134.455 454.818 136.07 452.719 137.254C450.619 138.439 448.17 139.031 445.37 139.031C442.463 139.031 439.987 138.439 437.941 137.254C435.895 136.07 434.872 134.455 434.872 132.409ZM539.529 130.31C539.529 130.094 539.637 129.556 539.852 128.694L571.023 27.1063C571.669 24.8452 573.257 23.0956 575.787 21.8573C578.318 20.6191 581.198 20 584.428 20C587.658 20 590.565 20.6191 593.149 21.8573C595.734 23.0956 597.349 24.8452 597.995 27.1063L629.166 128.694C629.381 129.556 629.489 130.094 629.489 130.31C629.489 132.678 628.035 134.724 625.128 136.447C622.221 138.17 619.26 139.031 616.245 139.031C612.261 139.031 609.892 137.631 609.139 134.832L603.001 113.351H566.016L559.879 134.832C559.125 137.631 556.756 139.031 552.773 139.031C549.65 139.031 546.662 138.197 543.809 136.528C540.956 134.859 539.529 132.786 539.529 130.31ZM570.377 96.8775H598.479L584.428 47.2948L570.377 96.8775Z" fill="black" class="bd-svg-black" />
  <path fill-rule="evenodd" clip-rule="evenodd" d="M0 110L10 40L50 0L100 50L70 80L110 120L50 160L0 110Z" fill="#00D1B2"/>
</svg>

  </a>

  <div class="navbar-item has-dropdown is-active">
    <a class="navbar-link">
      Docs
    </a>

    <div class="navbar-dropdown">
      <a class="navbar-item">
        Overview
      </a>
      <a class="navbar-item">
        Elements
      </a>
      <a class="navbar-item">
        Components
      </a>
      <hr class="navbar-divider">
      <div class="navbar-item">
        Version 1.0.4
      </div>
    </div>
  </div>
</nav>

<section class="hero is-primary">
  <div class="hero-body">
    <p class="title">
      Documentation
    </p>
    <p class="subtitle">
      Everything you need to <strong>create a website</strong> with Bulma
    </p>
  </div>
</section>

When having a transparent navbar, it is preferable to use the boxed version of the dropdown, by using the is-boxed modifier.

    the grey border is removed
    a slight inner shadow is added
    all corners are rounded
    the hover/active state is animated

Docs
Overview
Elements
Components
Version 1.0.4

Documentation

Everything you need to create a website with Bulma

<nav class="navbar is-transparent" role="navigation" aria-label="dropdown navigation">
  <a class="navbar-item">
    <svg width="640" height="160" viewBox="0 0 640 160" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path fill-rule="evenodd" clip-rule="evenodd" d="M170 132.571V27.5908C170 25.5451 170.915 23.93 172.746 22.7456C174.576 21.5612 176.729 20.969 179.206 20.969H210.377C232.019 20.969 242.84 30.4441 242.84 49.3943C242.84 62.5303 238.264 71.0902 229.112 75.074C234.603 77.2275 238.748 80.2692 241.548 84.1992C244.347 88.1292 245.747 93.8627 245.747 101.4V104.791C245.747 116.743 242.84 125.437 237.026 130.875C231.211 136.312 223.351 139.031 213.445 139.031H179.206C176.514 139.031 174.307 138.385 172.584 137.093C170.861 135.801 170 134.293 170 132.571ZM190.834 120.619H209.085C219.529 120.619 224.751 114.751 224.751 103.015V100.431C224.751 94.401 223.432 90.0404 220.794 87.3486C218.156 84.6568 214.253 83.3109 209.085 83.3109H190.834V120.619ZM190.834 66.8371H208.923C213.122 66.8371 216.326 65.5989 218.533 63.1225C220.74 60.646 221.844 57.2544 221.844 52.9475C221.844 48.7483 220.686 45.4374 218.371 43.0148C216.057 40.5922 212.853 39.3809 208.762 39.3809H190.834V66.8371ZM260.283 103.015V27.4293C260.283 25.2759 261.306 23.6608 263.351 22.5841C265.397 21.5074 267.873 20.969 270.781 20.969C273.688 20.969 276.164 21.5074 278.21 22.5841C280.256 23.6608 281.279 25.2759 281.279 27.4293V103.015C281.279 115.397 287.2 121.588 299.044 121.588C310.888 121.588 316.81 115.397 316.81 103.015V27.4293C316.81 25.2759 317.833 23.6608 319.879 22.5841C321.925 21.5074 324.401 20.969 327.308 20.969C330.215 20.969 332.692 21.5074 334.738 22.5841C336.783 23.6608 337.806 25.2759 337.806 27.4293V103.015C337.806 115.72 334.28 125.061 327.227 131.036C320.175 137.012 310.781 140 299.044 140C287.308 140 277.914 137.039 270.861 131.117C263.809 125.195 260.283 115.828 260.283 103.015ZM356.703 132.409V27.4293C356.703 25.2759 357.725 23.6608 359.771 22.5841C361.817 21.5074 364.293 20.969 367.201 20.969C370.108 20.969 372.584 21.5074 374.63 22.5841C376.676 23.6608 377.699 25.2759 377.699 27.4293V120.619H417.106C419.044 120.619 420.579 121.534 421.709 123.365C422.84 125.195 423.405 127.349 423.405 129.825C423.405 132.301 422.84 134.455 421.709 136.285C420.579 138.116 419.044 139.031 417.106 139.031H365.908C363.432 139.031 361.279 138.439 359.448 137.254C357.618 136.07 356.703 134.455 356.703 132.409ZM434.872 132.409V31.467C434.872 27.9138 435.868 25.2759 437.86 23.5532C439.852 21.8304 442.355 20.969 445.37 20.969C449.354 20.969 452.423 21.6689 454.576 23.0686C456.729 24.4684 459.098 27.4832 461.682 32.1131L481.548 68.2907L501.413 32.1131C503.997 27.4832 506.393 24.4684 508.6 23.0686C510.808 21.6689 513.903 20.969 517.887 20.969C520.902 20.969 523.405 21.8304 525.397 23.5532C527.389 25.2759 528.385 27.9138 528.385 31.467V132.409C528.385 134.455 527.335 136.07 525.236 137.254C523.136 138.439 520.686 139.031 517.887 139.031C514.98 139.031 512.503 138.439 510.458 137.254C508.412 136.07 507.389 134.455 507.389 132.409V62.961L488.493 96.5545C486.985 99.354 484.616 100.754 481.386 100.754C478.264 100.754 475.949 99.354 474.441 96.5545L455.868 61.6689V132.409C455.868 134.455 454.818 136.07 452.719 137.254C450.619 138.439 448.17 139.031 445.37 139.031C442.463 139.031 439.987 138.439 437.941 137.254C435.895 136.07 434.872 134.455 434.872 132.409ZM539.529 130.31C539.529 130.094 539.637 129.556 539.852 128.694L571.023 27.1063C571.669 24.8452 573.257 23.0956 575.787 21.8573C578.318 20.6191 581.198 20 584.428 20C587.658 20 590.565 20.6191 593.149 21.8573C595.734 23.0956 597.349 24.8452 597.995 27.1063L629.166 128.694C629.381 129.556 629.489 130.094 629.489 130.31C629.489 132.678 628.035 134.724 625.128 136.447C622.221 138.17 619.26 139.031 616.245 139.031C612.261 139.031 609.892 137.631 609.139 134.832L603.001 113.351H566.016L559.879 134.832C559.125 137.631 556.756 139.031 552.773 139.031C549.65 139.031 546.662 138.197 543.809 136.528C540.956 134.859 539.529 132.786 539.529 130.31ZM570.377 96.8775H598.479L584.428 47.2948L570.377 96.8775Z" fill="black" class="bd-svg-black" />
  <path fill-rule="evenodd" clip-rule="evenodd" d="M0 110L10 40L50 0L100 50L70 80L110 120L50 160L0 110Z" fill="#00D1B2"/>
</svg>

  </a>

  <div class="navbar-item has-dropdown is-active">
    <a class="navbar-link">
      Docs
    </a>

    <div class="navbar-dropdown is-boxed">
      <a class="navbar-item">
        Overview
      </a>
      <a class="navbar-item">
        Elements
      </a>
      <a class="navbar-item">
        Components
      </a>
      <hr class="navbar-divider">
      <div class="navbar-item">
        Version 1.0.4
      </div>
    </div>
  </div>
</nav>

<section class="hero">
  <div class="hero-body">
    <p class="title">
      Documentation
    </p>
    <p class="subtitle">
      Everything you need to <strong>create a website</strong> with Bulma
    </p>
  </div>
</section>

Active dropdown navbar item
Docs
Overview
Elements
Components
Version 1.0.4

Documentation

Everything you need to create a website with Bulma

<nav class="navbar" role="navigation" aria-label="dropdown navigation">
  <a class="navbar-item">
    <svg width="640" height="160" viewBox="0 0 640 160" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path fill-rule="evenodd" clip-rule="evenodd" d="M170 132.571V27.5908C170 25.5451 170.915 23.93 172.746 22.7456C174.576 21.5612 176.729 20.969 179.206 20.969H210.377C232.019 20.969 242.84 30.4441 242.84 49.3943C242.84 62.5303 238.264 71.0902 229.112 75.074C234.603 77.2275 238.748 80.2692 241.548 84.1992C244.347 88.1292 245.747 93.8627 245.747 101.4V104.791C245.747 116.743 242.84 125.437 237.026 130.875C231.211 136.312 223.351 139.031 213.445 139.031H179.206C176.514 139.031 174.307 138.385 172.584 137.093C170.861 135.801 170 134.293 170 132.571ZM190.834 120.619H209.085C219.529 120.619 224.751 114.751 224.751 103.015V100.431C224.751 94.401 223.432 90.0404 220.794 87.3486C218.156 84.6568 214.253 83.3109 209.085 83.3109H190.834V120.619ZM190.834 66.8371H208.923C213.122 66.8371 216.326 65.5989 218.533 63.1225C220.74 60.646 221.844 57.2544 221.844 52.9475C221.844 48.7483 220.686 45.4374 218.371 43.0148C216.057 40.5922 212.853 39.3809 208.762 39.3809H190.834V66.8371ZM260.283 103.015V27.4293C260.283 25.2759 261.306 23.6608 263.351 22.5841C265.397 21.5074 267.873 20.969 270.781 20.969C273.688 20.969 276.164 21.5074 278.21 22.5841C280.256 23.6608 281.279 25.2759 281.279 27.4293V103.015C281.279 115.397 287.2 121.588 299.044 121.588C310.888 121.588 316.81 115.397 316.81 103.015V27.4293C316.81 25.2759 317.833 23.6608 319.879 22.5841C321.925 21.5074 324.401 20.969 327.308 20.969C330.215 20.969 332.692 21.5074 334.738 22.5841C336.783 23.6608 337.806 25.2759 337.806 27.4293V103.015C337.806 115.72 334.28 125.061 327.227 131.036C320.175 137.012 310.781 140 299.044 140C287.308 140 277.914 137.039 270.861 131.117C263.809 125.195 260.283 115.828 260.283 103.015ZM356.703 132.409V27.4293C356.703 25.2759 357.725 23.6608 359.771 22.5841C361.817 21.5074 364.293 20.969 367.201 20.969C370.108 20.969 372.584 21.5074 374.63 22.5841C376.676 23.6608 377.699 25.2759 377.699 27.4293V120.619H417.106C419.044 120.619 420.579 121.534 421.709 123.365C422.84 125.195 423.405 127.349 423.405 129.825C423.405 132.301 422.84 134.455 421.709 136.285C420.579 138.116 419.044 139.031 417.106 139.031H365.908C363.432 139.031 361.279 138.439 359.448 137.254C357.618 136.07 356.703 134.455 356.703 132.409ZM434.872 132.409V31.467C434.872 27.9138 435.868 25.2759 437.86 23.5532C439.852 21.8304 442.355 20.969 445.37 20.969C449.354 20.969 452.423 21.6689 454.576 23.0686C456.729 24.4684 459.098 27.4832 461.682 32.1131L481.548 68.2907L501.413 32.1131C503.997 27.4832 506.393 24.4684 508.6 23.0686C510.808 21.6689 513.903 20.969 517.887 20.969C520.902 20.969 523.405 21.8304 525.397 23.5532C527.389 25.2759 528.385 27.9138 528.385 31.467V132.409C528.385 134.455 527.335 136.07 525.236 137.254C523.136 138.439 520.686 139.031 517.887 139.031C514.98 139.031 512.503 138.439 510.458 137.254C508.412 136.07 507.389 134.455 507.389 132.409V62.961L488.493 96.5545C486.985 99.354 484.616 100.754 481.386 100.754C478.264 100.754 475.949 99.354 474.441 96.5545L455.868 61.6689V132.409C455.868 134.455 454.818 136.07 452.719 137.254C450.619 138.439 448.17 139.031 445.37 139.031C442.463 139.031 439.987 138.439 437.941 137.254C435.895 136.07 434.872 134.455 434.872 132.409ZM539.529 130.31C539.529 130.094 539.637 129.556 539.852 128.694L571.023 27.1063C571.669 24.8452 573.257 23.0956 575.787 21.8573C578.318 20.6191 581.198 20 584.428 20C587.658 20 590.565 20.6191 593.149 21.8573C595.734 23.0956 597.349 24.8452 597.995 27.1063L629.166 128.694C629.381 129.556 629.489 130.094 629.489 130.31C629.489 132.678 628.035 134.724 625.128 136.447C622.221 138.17 619.26 139.031 616.245 139.031C612.261 139.031 609.892 137.631 609.139 134.832L603.001 113.351H566.016L559.879 134.832C559.125 137.631 556.756 139.031 552.773 139.031C549.65 139.031 546.662 138.197 543.809 136.528C540.956 134.859 539.529 132.786 539.529 130.31ZM570.377 96.8775H598.479L584.428 47.2948L570.377 96.8775Z" fill="black" class="bd-svg-black" />
  <path fill-rule="evenodd" clip-rule="evenodd" d="M0 110L10 40L50 0L100 50L70 80L110 120L50 160L0 110Z" fill="#00D1B2"/>
</svg>

  </a>

  <div class="navbar-item has-dropdown is-active">
    <a class="navbar-link">
      Docs
    </a>

    <div class="navbar-dropdown">
      <a class="navbar-item">
        Overview
      </a>
      <a class="navbar-item is-selected">
        Elements
      </a>
      <a class="navbar-item">
        Components
      </a>
      <hr class="navbar-divider">
      <div class="navbar-item">
        Version 1.0.4
      </div>
    </div>
  </div>
</nav>

<section class="hero is-primary">
  <div class="hero-body">
    <p class="title">
      Documentation
    </p>
    <p class="subtitle">
      Everything you need to <strong>create a website</strong> with Bulma
    </p>
  </div>
</section>

Dropdown divider

You can add a navbar-divider to display a horizontal rule in a navbar-dropdown.

<hr class="navbar-divider">

Colors
#

You can change the background color of the navbar by using one of the 9 color modifiers:

    is-primary
    is-link
    is-info
    is-success
    is-warning
    is-danger
    is-black
    is-dark
    is-light
    is-white

<nav class="navbar is-primary">
  <!-- navbar brand, navbar menu... -->
</nav>

Home
Docs
Overview
Modifiers
Columns
Layout
Form
Elements
Components

Home
Docs
Overview
Modifiers
Columns
Layout
Form
Elements
Components

Home
Docs
Overview
Modifiers
Columns
Layout
Form
Elements
Components

Home
Docs
Overview
Modifiers
Columns
Layout
Form
Elements
Components

Home
Docs
Overview
Modifiers
Columns
Layout
Form
Elements
Components

Home
Docs
Overview
Modifiers
Columns
Layout
Form
Elements
Components

Home
Docs
Overview
Modifiers
Columns
Layout
Form
Elements
Components

Home
Docs
Overview
Modifiers
Columns
Layout
Form
Elements
Components

Home
Docs
Overview
Modifiers
Columns
Layout
Form
Elements
Components

Home
Docs
Overview
Modifiers
Columns
Layout
Form
Elements
Components

Home
Docs
Overview
Modifiers
Columns
Layout
Form
Elements
Components

Navbar Helper Classes
#
Type 	Name 	Description
Spacing 	is-spaced 	Sets Top and Bottom paddings with 1rem,
Left and Right paddings with 2rem
Shading 	has-shadow 	Adds a small amount of box-shadow around the navbar
Sass and CSS variables
#
Sass Variable
	
CSS Variable
	
Value

$navbar-background-color

var(--bulma-navbar-background-color)

var(--bulma-scheme-main)

$navbar-box-shadow-size

var(--bulma-navbar-box-shadow-size)

0 0.125em 0 0

$navbar-box-shadow-color

var(--bulma-navbar-box-shadow-color)

var(--bulma-background)

$navbar-height

var(--bulma-navbar-height)

3.25rem

$navbar-padding-vertical

var(--bulma-navbar-padding-vertical)

1rem

$navbar-padding-horizontal

var(--bulma-navbar-padding-horizontal)

2rem

$navbar-z

var(--bulma-navbar-z)

30

$navbar-fixed-z

var(--bulma-navbar-fixed-z)

30

$navbar-item-img-max-height

var(--bulma-navbar-item-img-max-height)

1.75rem

$navbar-burger-color

var(--bulma-navbar-burger-color)

var(--bulma-navbar-item-color)

$navbar-tab-hover-background-color

var(--bulma-navbar-tab-hover-background-color)

transparent

$navbar-tab-hover-border-bottom-color

var(--bulma-navbar-tab-hover-border-bottom-color)

var(--bulma-link)

$navbar-tab-active-color

var(--bulma-navbar-tab-active-color)

var(--bulma-link)

$navbar-tab-active-background-color

var(--bulma-navbar-tab-active-background-color)

transparent

$navbar-tab-active-border-bottom-color

var(--bulma-navbar-tab-active-border-bottom-color)

var(--bulma-link)

$navbar-tab-active-border-bottom-style

var(--bulma-navbar-tab-active-border-bottom-style)

solid

$navbar-tab-active-border-bottom-width

var(--bulma-navbar-tab-active-border-bottom-width)

0.1875em

$navbar-dropdown-background-color

var(--bulma-navbar-dropdown-background-color)

var(--bulma-scheme-main)

$navbar-dropdown-border-l

var(--bulma-navbar-dropdown-border-l)

var(--bulma-border-l)

$navbar-dropdown-border-color

var(--bulma-navbar-dropdown-border-color)

hsl(
  var(--bulma-navbar-h),
  var(--bulma-navbar-s),
  var(--bulma-navbar-dropdown-border-l)
)

$navbar-dropdown-border-style

var(--bulma-navbar-dropdown-border-style)

solid

$navbar-dropdown-border-width

var(--bulma-navbar-dropdown-border-width)

0.125em

$navbar-dropdown-offset

var(--bulma-navbar-dropdown-offset)

-0.25em

$navbar-dropdown-arrow

var(--bulma-navbar-dropdown-arrow)

var(--bulma-link)

$navbar-dropdown-radius

var(--bulma-navbar-dropdown-radius)

var(--bulma-radius-large)

$navbar-dropdown-z

var(--bulma-navbar-dropdown-z)

20

$navbar-dropdown-boxed-radius

var(--bulma-navbar-dropdown-boxed-radius)

var(--bulma-radius-large)

$navbar-dropdown-boxed-shadow

var(--bulma-navbar-dropdown-boxed-shadow)

0 0.5em 0.5em hsla(
  var(--bulma-scheme-h),
  var(--bulma-scheme-s),
  var(--bulma-scheme-invert-l),
  0.1
),
0 0 0 1px hsla(
  var(--bulma-scheme-h),
  var(--bulma-scheme-s),
  var(--bulma-scheme-invert-l),
  0.1
)

$navbar-divider-background-l

var(--bulma-navbar-divider-background-l)

var(--bulma-background-l)

$navbar-divider-height

var(--bulma-navbar-divider-height)

0.125em

$navbar-bottom-box-shadow-size

var(--bulma-navbar-bottom-box-shadow-size)

0 -0.125em 0 0




Modal

A classic modal overlay, in which you can include any content you want
CSS Masterclass

The modal structure is very simple:

    modal: the main container
        modal-background: a transparent overlay that can act as a click target to close the modal
        modal-content: a horizontally and vertically centered container, with a maximum width of 640px, in which you can include any content
        modal-close: a simple cross located in the top right corner

<div class="modal">
  <div class="modal-background"></div>
  <div class="modal-content">
    <!-- Any other Bulma elements you want -->
  </div>
  <button class="modal-close is-large" aria-label="close"></button>
</div>

To activate the modal, just add the is-active modifier on the .modal container. You may also want to add is-clipped modifier to a containing element (usually html) to stop scroll overflow.
JavaScript implementation example
Bulma does not include any JavaScript. However, this documentation provides a JS implementation example that you are free to use.
Image modal
#

Because a modal can contain anything you want, you can very simply use it to build an image gallery for example:

<div class="modal">
  <div class="modal-background"></div>
  <div class="modal-content">
    <p class="image is-4by3">
      <img src="https://bulma.io/assets/images/placeholders/1280x960.png" alt="">
    </p>
  </div>
  <button class="modal-close is-large" aria-label="close"></button>
</div>

Modal card
#

If you want a more classic modal, with a head, a body and a foot, use the modal-card.

<div class="modal">
  <div class="modal-background"></div>
  <div class="modal-card">
    <header class="modal-card-head">
      <p class="modal-card-title">Modal title</p>
      <button class="delete" aria-label="close"></button>
    </header>
    <section class="modal-card-body">
      <!-- Content ... -->
    </section>
    <footer class="modal-card-foot">
      <div class="buttons">
        <button class="button is-success">Save changes</button>
        <button class="button">Cancel</button>
      </div>
    </footer>
  </div>
</div>

JavaScript implementation example
#

The Bulma package does not come with any JavaScript. Here is however an implementation example, which sets the click handlers for custom elements, in vanilla JavaScript.

There are 3 parts to this implementation:

    add the HTML for the modal (this modal is hidden by default)
    add the HTML for a button to trigger the modal (you can style this button however you want)
    add the JS code to add the click event on the trigger to open the modal

1. Add the HTML for the modal

At the end of your page, before the closing </body> tag, at the following HTML snippet:

<div id="modal-js-example" class="modal">
  <div class="modal-background"></div>

  <div class="modal-content">
    <div class="box">
      <p>Modal JS example</p>
      <!-- Your content -->
    </div>
  </div>

  <button class="modal-close is-large" aria-label="close"></button>
</div>

The id attribute's value must be unique.
2. Add the HTML for the trigger

Somewhere on your page, add the following HTML button:

<button class="js-modal-trigger" data-target="modal-js-example">
  Open JS example modal
</button>

You can style it however you want, as long as it has the js-modal-trigger CSS class and the appropriate data-target value. For example, you can add the button is-primary Bulma classes:
3. Add the JS for the trigger

In a script element (or in a separate .js file), add the following JS code:

document.addEventListener('DOMContentLoaded', () => {
  // Functions to open and close a modal
  function openModal($el) {
    $el.classList.add('is-active');
  }

  function closeModal($el) {
    $el.classList.remove('is-active');
  }

  function closeAllModals() {
    (document.querySelectorAll('.modal') || []).forEach(($modal) => {
      closeModal($modal);
    });
  }

  // Add a click event on buttons to open a specific modal
  (document.querySelectorAll('.js-modal-trigger') || []).forEach(($trigger) => {
    const modal = $trigger.dataset.target;
    const $target = document.getElementById(modal);

    $trigger.addEventListener('click', () => {
      openModal($target);
    });
  });

  // Add a click event on various child elements to close the parent modal
  (document.querySelectorAll('.modal-background, .modal-close, .modal-card-head .delete, .modal-card-foot .button') || []).forEach(($close) => {
    const $target = $close.closest('.modal');

    $close.addEventListener('click', () => {
      closeModal($target);
    });
  });

  // Add a keyboard event to close all modals
  document.addEventListener('keydown', (event) => {
    if(event.key === "Escape") {
      closeAllModals();
    }
  });
});

As long as you can toggle the is-active modifier class on the modal element, you can choose how you want to implement it.
Sass and CSS variables
#
Sass Variable
	
CSS Variable
	
Value

$modal-z

var(--bulma-modal-z)

40

$modal-background-background-color

var(--bulma-modal-background-background-color)

hsla(
  var(--bulma-scheme-h),
  var(--bulma-scheme-s),
  var(--bulma-scheme-invert-l),
  0.86
)

$modal-content-width

var(--bulma-modal-content-width)

40rem

$modal-content-margin-mobile

var(--bulma-modal-content-margin-mobile)

1.25rem

$modal-content-spacing-mobile

var(--bulma-modal-content-spacing-mobile)

10rem

$modal-content-spacing-tablet

var(--bulma-modal-content-spacing-tablet)

2.5rem

$modal-close-dimensions

var(--bulma-modal-close-dimensions)

2.5rem

$modal-close-right

var(--bulma-modal-close-right)

1.25rem

$modal-close-top

var(--bulma-modal-close-top)

1.25rem

$modal-card-spacing

var(--bulma-modal-card-spacing)

2.5rem

$modal-card-head-background-color

var(--bulma-modal-card-head-background-color)

var(--bulma-scheme-main)

$modal-card-head-padding

var(--bulma-modal-card-head-padding)

2rem

$modal-card-head-radius

var(--bulma-modal-card-head-radius)

var(--bulma-radius-large)

$modal-card-title-color

var(--bulma-modal-card-title-color)

var(--bulma-text-strong)

$modal-card-title-line-height

var(--bulma-modal-card-title-line-height)

1

$modal-card-title-size

var(--bulma-modal-card-title-size)

var(--bulma-size-4)

$modal-card-foot-background-color

var(--bulma-modal-card-foot-background-color)

var(--bulma-scheme-main-bis)

$modal-card-foot-radius

var(--bulma-modal-card-foot-radius)

var(--bulma-radius-large)

$modal-card-body-background-color

var(--bulma-modal-card-body-background-color)

var(--bulma-scheme-main)

$modal-card-body-padding

var(--bulma-modal-card-body-padding)

2rem



Message

Colored message blocks, to emphasize part of your page
CSS Masterclass

The Bulma message is a multi-part component:

    the message container
    the optional message-header that can hold a title and a delete element
    the message-body for the longer body of the message

Example

Hello World
Lorem ipsum dolor sit amet, consectetur adipiscing elit. Pellentesque risus mi, tempus quis placerat ut, porta nec nulla. Vestibulum rhoncus ac ex sit amet fringilla. Nullam gravida purus diam, et dictum felis venenatis efficitur. Aenean ac eleifend lacus, in mollis lectus. Donec sodales, arcu et sollicitudin porttitor, tortor urna tempor ligula, id porttitor mi magna a neque. Donec dui urna, vehicula et sem eget, facilisis sodales sem.

HTML

<article class="message">
  <div class="message-header">
    <p>Hello World</p>
    <button class="delete" aria-label="delete"></button>
  </div>
  <div class="message-body">
    Lorem ipsum dolor sit amet, consectetur adipiscing elit.
    <strong>Pellentesque risus mi</strong>, tempus quis placerat ut, porta nec
    nulla. Vestibulum rhoncus ac ex sit amet fringilla. Nullam gravida purus
    diam, et dictum <a>felis venenatis</a> efficitur. Aenean ac
    <em>eleifend lacus</em>, in mollis lectus. Donec sodales, arcu et
    sollicitudin porttitor, tortor urna tempor ligula, id porttitor mi magna a
    neque. Donec dui urna, vehicula et sem eget, facilisis sodales sem.
  </div>
</article>

Colors
#

The message component is available in all the different colors defined by the $colors Sass map.

Example

Dark
Lorem ipsum dolor sit amet, consectetur adipiscing elit. Pellentesque risus mi, tempus quis placerat ut, porta nec nulla. Vestibulum rhoncus ac ex sit amet fringilla. Nullam gravida purus diam, et dictum felis venenatis efficitur. Aenean ac eleifend lacus, in mollis lectus. Donec sodales, arcu et sollicitudin porttitor, tortor urna tempor ligula, id porttitor mi magna a neque. Donec dui urna, vehicula et sem eget, facilisis sodales sem.

HTML

<article class="message is-dark">
  <div class="message-header">
    <p>Dark</p>
    <button class="delete" aria-label="delete"></button>
  </div>
  <div class="message-body">
    Lorem ipsum dolor sit amet, consectetur adipiscing elit.
    <strong>Pellentesque risus mi</strong>, tempus quis placerat ut, porta nec
    nulla. Vestibulum rhoncus ac ex sit amet fringilla. Nullam gravida purus
    diam, et dictum <a>felis venenatis</a> efficitur. Aenean ac
    <em>eleifend lacus</em>, in mollis lectus. Donec sodales, arcu et
    sollicitudin porttitor, tortor urna tempor ligula, id porttitor mi magna a
    neque. Donec dui urna, vehicula et sem eget, facilisis sodales sem.
  </div>
</article>

Example

Link
Lorem ipsum dolor sit amet, consectetur adipiscing elit. Pellentesque risus mi, tempus quis placerat ut, porta nec nulla. Vestibulum rhoncus ac ex sit amet fringilla. Nullam gravida purus diam, et dictum felis venenatis efficitur. Aenean ac eleifend lacus, in mollis lectus. Donec sodales, arcu et sollicitudin porttitor, tortor urna tempor ligula, id porttitor mi magna a neque. Donec dui urna, vehicula et sem eget, facilisis sodales sem.

HTML

<article class="message is-link">
  <div class="message-header">
    <p>Link</p>
    <button class="delete" aria-label="delete"></button>
  </div>
  <div class="message-body">
    Lorem ipsum dolor sit amet, consectetur adipiscing elit.
    <strong>Pellentesque risus mi</strong>, tempus quis placerat ut, porta nec
    nulla. Vestibulum rhoncus ac ex sit amet fringilla. Nullam gravida purus
    diam, et dictum <a>felis venenatis</a> efficitur. Aenean ac
    <em>eleifend lacus</em>, in mollis lectus. Donec sodales, arcu et
    sollicitudin porttitor, tortor urna tempor ligula, id porttitor mi magna a
    neque. Donec dui urna, vehicula et sem eget, facilisis sodales sem.
  </div>
</article>

Example

Primary
Lorem ipsum dolor sit amet, consectetur adipiscing elit. Pellentesque risus mi, tempus quis placerat ut, porta nec nulla. Vestibulum rhoncus ac ex sit amet fringilla. Nullam gravida purus diam, et dictum felis venenatis efficitur. Aenean ac eleifend lacus, in mollis lectus. Donec sodales, arcu et sollicitudin porttitor, tortor urna tempor ligula, id porttitor mi magna a neque. Donec dui urna, vehicula et sem eget, facilisis sodales sem.

HTML

<article class="message is-primary">
  <div class="message-header">
    <p>Primary</p>
    <button class="delete" aria-label="delete"></button>
  </div>
  <div class="message-body">
    Lorem ipsum dolor sit amet, consectetur adipiscing elit.
    <strong>Pellentesque risus mi</strong>, tempus quis placerat ut, porta nec
    nulla. Vestibulum rhoncus ac ex sit amet fringilla. Nullam gravida purus
    diam, et dictum <a>felis venenatis</a> efficitur. Aenean ac
    <em>eleifend lacus</em>, in mollis lectus. Donec sodales, arcu et
    sollicitudin porttitor, tortor urna tempor ligula, id porttitor mi magna a
    neque. Donec dui urna, vehicula et sem eget, facilisis sodales sem.
  </div>
</article>

Example

Info
Lorem ipsum dolor sit amet, consectetur adipiscing elit. Pellentesque risus mi, tempus quis placerat ut, porta nec nulla. Vestibulum rhoncus ac ex sit amet fringilla. Nullam gravida purus diam, et dictum felis venenatis efficitur. Aenean ac eleifend lacus, in mollis lectus. Donec sodales, arcu et sollicitudin porttitor, tortor urna tempor ligula, id porttitor mi magna a neque. Donec dui urna, vehicula et sem eget, facilisis sodales sem.

HTML

<article class="message is-info">
  <div class="message-header">
    <p>Info</p>
    <button class="delete" aria-label="delete"></button>
  </div>
  <div class="message-body">
    Lorem ipsum dolor sit amet, consectetur adipiscing elit.
    <strong>Pellentesque risus mi</strong>, tempus quis placerat ut, porta nec
    nulla. Vestibulum rhoncus ac ex sit amet fringilla. Nullam gravida purus
    diam, et dictum <a>felis venenatis</a> efficitur. Aenean ac
    <em>eleifend lacus</em>, in mollis lectus. Donec sodales, arcu et
    sollicitudin porttitor, tortor urna tempor ligula, id porttitor mi magna a
    neque. Donec dui urna, vehicula et sem eget, facilisis sodales sem.
  </div>
</article>

Example

Success
Lorem ipsum dolor sit amet, consectetur adipiscing elit. Pellentesque risus mi, tempus quis placerat ut, porta nec nulla. Vestibulum rhoncus ac ex sit amet fringilla. Nullam gravida purus diam, et dictum felis venenatis efficitur. Aenean ac eleifend lacus, in mollis lectus. Donec sodales, arcu et sollicitudin porttitor, tortor urna tempor ligula, id porttitor mi magna a neque. Donec dui urna, vehicula et sem eget, facilisis sodales sem.

HTML

<article class="message is-success">
  <div class="message-header">
    <p>Success</p>
    <button class="delete" aria-label="delete"></button>
  </div>
  <div class="message-body">
    Lorem ipsum dolor sit amet, consectetur adipiscing elit.
    <strong>Pellentesque risus mi</strong>, tempus quis placerat ut, porta nec
    nulla. Vestibulum rhoncus ac ex sit amet fringilla. Nullam gravida purus
    diam, et dictum <a>felis venenatis</a> efficitur. Aenean ac
    <em>eleifend lacus</em>, in mollis lectus. Donec sodales, arcu et
    sollicitudin porttitor, tortor urna tempor ligula, id porttitor mi magna a
    neque. Donec dui urna, vehicula et sem eget, facilisis sodales sem.
  </div>
</article>

Example

Warning
Lorem ipsum dolor sit amet, consectetur adipiscing elit. Pellentesque risus mi, tempus quis placerat ut, porta nec nulla. Vestibulum rhoncus ac ex sit amet fringilla. Nullam gravida purus diam, et dictum felis venenatis efficitur. Aenean ac eleifend lacus, in mollis lectus. Donec sodales, arcu et sollicitudin porttitor, tortor urna tempor ligula, id porttitor mi magna a neque. Donec dui urna, vehicula et sem eget, facilisis sodales sem.

HTML

<article class="message is-warning">
  <div class="message-header">
    <p>Warning</p>
    <button class="delete" aria-label="delete"></button>
  </div>
  <div class="message-body">
    Lorem ipsum dolor sit amet, consectetur adipiscing elit.
    <strong>Pellentesque risus mi</strong>, tempus quis placerat ut, porta nec
    nulla. Vestibulum rhoncus ac ex sit amet fringilla. Nullam gravida purus
    diam, et dictum <a>felis venenatis</a> efficitur. Aenean ac
    <em>eleifend lacus</em>, in mollis lectus. Donec sodales, arcu et
    sollicitudin porttitor, tortor urna tempor ligula, id porttitor mi magna a
    neque. Donec dui urna, vehicula et sem eget, facilisis sodales sem.
  </div>
</article>

Example

Danger
Lorem ipsum dolor sit amet, consectetur adipiscing elit. Pellentesque risus mi, tempus quis placerat ut, porta nec nulla. Vestibulum rhoncus ac ex sit amet fringilla. Nullam gravida purus diam, et dictum felis venenatis efficitur. Aenean ac eleifend lacus, in mollis lectus. Donec sodales, arcu et sollicitudin porttitor, tortor urna tempor ligula, id porttitor mi magna a neque. Donec dui urna, vehicula et sem eget, facilisis sodales sem.

HTML

<article class="message is-danger">
  <div class="message-header">
    <p>Danger</p>
    <button class="delete" aria-label="delete"></button>
  </div>
  <div class="message-body">
    Lorem ipsum dolor sit amet, consectetur adipiscing elit.
    <strong>Pellentesque risus mi</strong>, tempus quis placerat ut, porta nec
    nulla. Vestibulum rhoncus ac ex sit amet fringilla. Nullam gravida purus
    diam, et dictum <a>felis venenatis</a> efficitur. Aenean ac
    <em>eleifend lacus</em>, in mollis lectus. Donec sodales, arcu et
    sollicitudin porttitor, tortor urna tempor ligula, id porttitor mi magna a
    neque. Donec dui urna, vehicula et sem eget, facilisis sodales sem.
  </div>
</article>

Message body only
#

You can remove the message-header if you don't need it, which will add a left border to the message-body:

Example
Lorem ipsum dolor sit amet, consectetur adipiscing elit. Pellentesque risus mi, tempus quis placerat ut, porta nec nulla. Vestibulum rhoncus ac ex sit amet fringilla. Nullam gravida purus diam, et dictum felis venenatis efficitur. Aenean ac eleifend lacus, in mollis lectus. Donec sodales, arcu et sollicitudin porttitor, tortor urna tempor ligula, id porttitor mi magna a neque. Donec dui urna, vehicula et sem eget, facilisis sodales sem.

HTML

<article class="message">
  <div class="message-body">
    Lorem ipsum dolor sit amet, consectetur adipiscing elit.
    <strong>Pellentesque risus mi</strong>, tempus quis placerat ut, porta nec
    nulla. Vestibulum rhoncus ac ex sit amet fringilla. Nullam gravida purus
    diam, et dictum <a>felis venenatis</a> efficitur. Aenean ac
    <em>eleifend lacus</em>, in mollis lectus. Donec sodales, arcu et
    sollicitudin porttitor, tortor urna tempor ligula, id porttitor mi magna a
    neque. Donec dui urna, vehicula et sem eget, facilisis sodales sem.
  </div>
</article>

Example
Lorem ipsum dolor sit amet, consectetur adipiscing elit. Pellentesque risus mi, tempus quis placerat ut, porta nec nulla. Vestibulum rhoncus ac ex sit amet fringilla. Nullam gravida purus diam, et dictum felis venenatis efficitur. Aenean ac eleifend lacus, in mollis lectus. Donec sodales, arcu et sollicitudin porttitor, tortor urna tempor ligula, id porttitor mi magna a neque. Donec dui urna, vehicula et sem eget, facilisis sodales sem.

HTML

<article class="message is-dark">
  <div class="message-body">
    Lorem ipsum dolor sit amet, consectetur adipiscing elit.
    <strong>Pellentesque risus mi</strong>, tempus quis placerat ut, porta nec
    nulla. Vestibulum rhoncus ac ex sit amet fringilla. Nullam gravida purus
    diam, et dictum <a>felis venenatis</a> efficitur. Aenean ac
    <em>eleifend lacus</em>, in mollis lectus. Donec sodales, arcu et
    sollicitudin porttitor, tortor urna tempor ligula, id porttitor mi magna a
    neque. Donec dui urna, vehicula et sem eget, facilisis sodales sem.
  </div>
</article>

Example
Lorem ipsum dolor sit amet, consectetur adipiscing elit. Pellentesque risus mi, tempus quis placerat ut, porta nec nulla. Vestibulum rhoncus ac ex sit amet fringilla. Nullam gravida purus diam, et dictum felis venenatis efficitur. Aenean ac eleifend lacus, in mollis lectus. Donec sodales, arcu et sollicitudin porttitor, tortor urna tempor ligula, id porttitor mi magna a neque. Donec dui urna, vehicula et sem eget, facilisis sodales sem.

HTML

<article class="message is-link">
  <div class="message-body">
    Lorem ipsum dolor sit amet, consectetur adipiscing elit.
    <strong>Pellentesque risus mi</strong>, tempus quis placerat ut, porta nec
    nulla. Vestibulum rhoncus ac ex sit amet fringilla. Nullam gravida purus
    diam, et dictum <a>felis venenatis</a> efficitur. Aenean ac
    <em>eleifend lacus</em>, in mollis lectus. Donec sodales, arcu et
    sollicitudin porttitor, tortor urna tempor ligula, id porttitor mi magna a
    neque. Donec dui urna, vehicula et sem eget, facilisis sodales sem.
  </div>
</article>

Example
Lorem ipsum dolor sit amet, consectetur adipiscing elit. Pellentesque risus mi, tempus quis placerat ut, porta nec nulla. Vestibulum rhoncus ac ex sit amet fringilla. Nullam gravida purus diam, et dictum felis venenatis efficitur. Aenean ac eleifend lacus, in mollis lectus. Donec sodales, arcu et sollicitudin porttitor, tortor urna tempor ligula, id porttitor mi magna a neque. Donec dui urna, vehicula et sem eget, facilisis sodales sem.

HTML

<article class="message is-primary">
  <div class="message-body">
    Lorem ipsum dolor sit amet, consectetur adipiscing elit.
    <strong>Pellentesque risus mi</strong>, tempus quis placerat ut, porta nec
    nulla. Vestibulum rhoncus ac ex sit amet fringilla. Nullam gravida purus
    diam, et dictum <a>felis venenatis</a> efficitur. Aenean ac
    <em>eleifend lacus</em>, in mollis lectus. Donec sodales, arcu et
    sollicitudin porttitor, tortor urna tempor ligula, id porttitor mi magna a
    neque. Donec dui urna, vehicula et sem eget, facilisis sodales sem.
  </div>
</article>

Example
Lorem ipsum dolor sit amet, consectetur adipiscing elit. Pellentesque risus mi, tempus quis placerat ut, porta nec nulla. Vestibulum rhoncus ac ex sit amet fringilla. Nullam gravida purus diam, et dictum felis venenatis efficitur. Aenean ac eleifend lacus, in mollis lectus. Donec sodales, arcu et sollicitudin porttitor, tortor urna tempor ligula, id porttitor mi magna a neque. Donec dui urna, vehicula et sem eget, facilisis sodales sem.

HTML

<article class="message is-info">
  <div class="message-body">
    Lorem ipsum dolor sit amet, consectetur adipiscing elit.
    <strong>Pellentesque risus mi</strong>, tempus quis placerat ut, porta nec
    nulla. Vestibulum rhoncus ac ex sit amet fringilla. Nullam gravida purus
    diam, et dictum <a>felis venenatis</a> efficitur. Aenean ac
    <em>eleifend lacus</em>, in mollis lectus. Donec sodales, arcu et
    sollicitudin porttitor, tortor urna tempor ligula, id porttitor mi magna a
    neque. Donec dui urna, vehicula et sem eget, facilisis sodales sem.
  </div>
</article>

Example
Lorem ipsum dolor sit amet, consectetur adipiscing elit. Pellentesque risus mi, tempus quis placerat ut, porta nec nulla. Vestibulum rhoncus ac ex sit amet fringilla. Nullam gravida purus diam, et dictum felis venenatis efficitur. Aenean ac eleifend lacus, in mollis lectus. Donec sodales, arcu et sollicitudin porttitor, tortor urna tempor ligula, id porttitor mi magna a neque. Donec dui urna, vehicula et sem eget, facilisis sodales sem.

HTML

<article class="message is-success">
  <div class="message-body">
    Lorem ipsum dolor sit amet, consectetur adipiscing elit.
    <strong>Pellentesque risus mi</strong>, tempus quis placerat ut, porta nec
    nulla. Vestibulum rhoncus ac ex sit amet fringilla. Nullam gravida purus
    diam, et dictum <a>felis venenatis</a> efficitur. Aenean ac
    <em>eleifend lacus</em>, in mollis lectus. Donec sodales, arcu et
    sollicitudin porttitor, tortor urna tempor ligula, id porttitor mi magna a
    neque. Donec dui urna, vehicula et sem eget, facilisis sodales sem.
  </div>
</article>

Example
Lorem ipsum dolor sit amet, consectetur adipiscing elit. Pellentesque risus mi, tempus quis placerat ut, porta nec nulla. Vestibulum rhoncus ac ex sit amet fringilla. Nullam gravida purus diam, et dictum felis venenatis efficitur. Aenean ac eleifend lacus, in mollis lectus. Donec sodales, arcu et sollicitudin porttitor, tortor urna tempor ligula, id porttitor mi magna a neque. Donec dui urna, vehicula et sem eget, facilisis sodales sem.

HTML

<article class="message is-warning">
  <div class="message-body">
    Lorem ipsum dolor sit amet, consectetur adipiscing elit.
    <strong>Pellentesque risus mi</strong>, tempus quis placerat ut, porta nec
    nulla. Vestibulum rhoncus ac ex sit amet fringilla. Nullam gravida purus
    diam, et dictum <a>felis venenatis</a> efficitur. Aenean ac
    <em>eleifend lacus</em>, in mollis lectus. Donec sodales, arcu et
    sollicitudin porttitor, tortor urna tempor ligula, id porttitor mi magna a
    neque. Donec dui urna, vehicula et sem eget, facilisis sodales sem.
  </div>
</article>

Example
Lorem ipsum dolor sit amet, consectetur adipiscing elit. Pellentesque risus mi, tempus quis placerat ut, porta nec nulla. Vestibulum rhoncus ac ex sit amet fringilla. Nullam gravida purus diam, et dictum felis venenatis efficitur. Aenean ac eleifend lacus, in mollis lectus. Donec sodales, arcu et sollicitudin porttitor, tortor urna tempor ligula, id porttitor mi magna a neque. Donec dui urna, vehicula et sem eget, facilisis sodales sem.

HTML

<article class="message is-danger">
  <div class="message-body">
    Lorem ipsum dolor sit amet, consectetur adipiscing elit.
    <strong>Pellentesque risus mi</strong>, tempus quis placerat ut, porta nec
    nulla. Vestibulum rhoncus ac ex sit amet fringilla. Nullam gravida purus
    diam, et dictum <a>felis venenatis</a> efficitur. Aenean ac
    <em>eleifend lacus</em>, in mollis lectus. Donec sodales, arcu et
    sollicitudin porttitor, tortor urna tempor ligula, id porttitor mi magna a
    neque. Donec dui urna, vehicula et sem eget, facilisis sodales sem.
  </div>
</article>

Sizes
#

You can add one of 3 size modifiers to the message component:

Example

Small message
Lorem ipsum dolor sit amet, consectetur adipiscing elit. Pellentesque risus mi, tempus quis placerat ut, porta nec nulla.Nullam gravida purus diam, et dictum felis venenatis efficitur. Aenean ac eleifend lacus, in mollis lectus.

HTML

<article class="message is-small">
  <div class="message-header">
    <p>Small message</p>
    <button class="delete is-small" aria-label="delete"></button>
  </div>
  <div class="message-body">
    Lorem ipsum dolor sit amet, consectetur adipiscing elit.
    <strong>Pellentesque risus mi</strong>, tempus quis placerat ut, porta nec
    nulla.Nullam gravida purus diam, et dictum <a>felis venenatis</a> efficitur.
    Aenean ac <em>eleifend lacus</em>, in mollis lectus.
  </div>
</article>

Example

Normal message
Lorem ipsum dolor sit amet, consectetur adipiscing elit. Pellentesque risus mi, tempus quis placerat ut, porta nec nulla.Nullam gravida purus diam, et dictum felis venenatis efficitur. Aenean ac eleifend lacus, in mollis lectus.

HTML

<article class="message">
  <div class="message-header">
    <p>Normal message</p>
    <button class="delete" aria-label="delete"></button>
  </div>
  <div class="message-body">
    Lorem ipsum dolor sit amet, consectetur adipiscing elit.
    <strong>Pellentesque risus mi</strong>, tempus quis placerat ut, porta nec
    nulla.Nullam gravida purus diam, et dictum <a>felis venenatis</a> efficitur.
    Aenean ac <em>eleifend lacus</em>, in mollis lectus.
  </div>
</article>

Example

Medium message
Lorem ipsum dolor sit amet, consectetur adipiscing elit. Pellentesque risus mi, tempus quis placerat ut, porta nec nulla.Nullam gravida purus diam, et dictum felis venenatis efficitur. Aenean ac eleifend lacus, in mollis lectus.

HTML

<article class="message is-medium">
  <div class="message-header">
    <p>Medium message</p>
    <button class="delete is-medium" aria-label="delete"></button>
  </div>
  <div class="message-body">
    Lorem ipsum dolor sit amet, consectetur adipiscing elit.
    <strong>Pellentesque risus mi</strong>, tempus quis placerat ut, porta nec
    nulla.Nullam gravida purus diam, et dictum <a>felis venenatis</a> efficitur.
    Aenean ac <em>eleifend lacus</em>, in mollis lectus.
  </div>
</article>

Example

Large message
Lorem ipsum dolor sit amet, consectetur adipiscing elit. Pellentesque risus mi, tempus quis placerat ut, porta nec nulla.Nullam gravida purus diam, et dictum felis venenatis efficitur. Aenean ac eleifend lacus, in mollis lectus.

HTML

<article class="message is-large">
  <div class="message-header">
    <p>Large message</p>
    <button class="delete is-large" aria-label="delete"></button>
  </div>
  <div class="message-body">
    Lorem ipsum dolor sit amet, consectetur adipiscing elit.
    <strong>Pellentesque risus mi</strong>, tempus quis placerat ut, porta nec
    nulla.Nullam gravida purus diam, et dictum <a>felis venenatis</a> efficitur.
    Aenean ac <em>eleifend lacus</em>, in mollis lectus.
  </div>
</article>

Sass and CSS variables
#
Sass Variable
	
CSS Variable
	
Value

$message-border-l-delta

var(--bulma-message-border-l-delta)

-20%

$message-radius

var(--bulma-message-radius)

var(--bulma-radius)

$message-header-weight

var(--bulma-message-header-weight)

var(--bulma-weight-semibold)

$message-header-padding

var(--bulma-message-header-padding)

1em 1.25em

$message-header-radius

var(--bulma-message-header-radius)

var(--bulma-radius)

$message-body-border-width

var(--bulma-message-body-border-width)

0 0 0 4px

$message-body-color

var(--bulma-message-body-color)

var(--bulma-text)

$message-body-padding

var(--bulma-message-body-padding)

1.25em 1.5em

$message-body-radius

var(--bulma-message-body-radius)

var(--bulma-radius-small)

$message-body-pre-code-background-color

var(--bulma-message-body-pre-code-background-color)

transparent

$message-header-body-border-width

var(--bulma-message-header-body-border-width)

0

Sass and CSS variables
#
Sass Variable
	
CSS Variable
	
Value

$message-border-l-delta

var(--bulma-message-border-l-delta)

-20%

$message-radius

var(--bulma-message-radius)

var(--bulma-radius)

$message-header-weight

var(--bulma-message-header-weight)

var(--bulma-weight-semibold)

$message-header-padding

var(--bulma-message-header-padding)

1em 1.25em

$message-header-radius

var(--bulma-message-header-radius)

var(--bulma-radius)

$message-body-border-width

var(--bulma-message-body-border-width)

0 0 0 4px

$message-body-color

var(--bulma-message-body-color)

var(--bulma-text)

$message-body-padding

var(--bulma-message-body-padding)

1.25em 1.5em

$message-body-radius

var(--bulma-message-body-radius)

var(--bulma-radius-small)

$message-body-pre-code-background-color

var(--bulma-message-body-pre-code-background-color)

transparent

$message-header-body-border-width

var(--bulma-message-header-body-border-width)

0



Menu

A simple menu, for any type of vertical navigation
CSS Masterclass

The Bulma menu is a vertical navigation component that comprises:

    the menu container
    informative menu-label labels
    interactive menu-list lists that can be nested up to 2 levels

Example

General

    Dashboard
    Customers

Administration

    Team Settings
    Manage Your Team
        Members
        Plugins
        Add a member
    Invitations
    Cloud Storage Environment Settings
    Authentication

Transactions

    Payments
    Transfers
    Balance

HTML

<aside class="menu">
  <p class="menu-label">General</p>
  <ul class="menu-list">
    <li><a>Dashboard</a></li>
    <li><a>Customers</a></li>
  </ul>
  <p class="menu-label">Administration</p>
  <ul class="menu-list">
    <li><a>Team Settings</a></li>
    <li>
      <a class="is-active">Manage Your Team</a>
      <ul>
        <li><a>Members</a></li>
        <li><a>Plugins</a></li>
        <li><a>Add a member</a></li>
      </ul>
    </li>
    <li><a>Invitations</a></li>
    <li><a>Cloud Storage Environment Settings</a></li>
    <li><a>Authentication</a></li>
  </ul>
  <p class="menu-label">Transactions</p>
  <ul class="menu-list">
    <li><a>Payments</a></li>
    <li><a>Transfers</a></li>
    <li><a>Balance</a></li>
  </ul>
</aside>

Sass and CSS variables
#
Sass Variable
	
CSS Variable
	
Value

$menu-item-radius

var(--bulma-menu-item-radius)

var(--bulma-radius-small)

$menu-list-border-left

var(--bulma-menu-list-border-left)

1px solid var(--bulma-border)

$menu-list-line-height

var(--bulma-menu-list-line-height)

1.25

$menu-list-link-padding

var(--bulma-menu-list-link-padding)

0.5em 0.75em

$menu-nested-list-margin

var(--bulma-menu-nested-list-margin)

0.75em

$menu-nested-list-padding-left

var(--bulma-menu-nested-list-padding-left)

0.75em

$menu-label-color

var(--bulma-menu-label-color)

var(--bulma-text-weak)

$menu-label-font-size

var(--bulma-menu-label-font-size)

0.75em

$menu-label-letter-spacing

var(--bulma-menu-label-letter-spacing)

0.1em

$menu-label-spacing

var(--bulma-menu-label-spacing)

1em



Dropdown

An interactive dropdown menu for discoverable content
CSS Masterclass

The dropdown component is a container for a dropdown button and a dropdown menu.

    dropdown the main container
        dropdown-trigger the container for a button
        dropdown-menu the toggable menu, hidden by default
            dropdown-content the dropdown box, with a white background and a shadow
                dropdown-item each single item of the dropdown, which can either be a a or a div
                dropdown-divider a horizontal line to separate dropdown items

Example

HTML

<div class="dropdown is-active">
  <div class="dropdown-trigger">
    <button class="button" aria-haspopup="true" aria-controls="dropdown-menu">
      <span>Dropdown button</span>
      <span class="icon is-small">
        <i class="fas fa-angle-down" aria-hidden="true"></i>
      </span>
    </button>
  </div>
  <div class="dropdown-menu" id="dropdown-menu" role="menu">
    <div class="dropdown-content">
      <a href="#" class="dropdown-item"> Dropdown item </a>
      <a class="dropdown-item"> Other dropdown item </a>
      <a href="#" class="dropdown-item is-active"> Active dropdown item </a>
      <a href="#" class="dropdown-item"> Other dropdown item </a>
      <hr class="dropdown-divider" />
      <a href="#" class="dropdown-item"> With a divider </a>
    </div>
  </div>
</div>

Dropdown content
#

While the dropdown-item can be used as an anchor link <a>, you can also use a <div> and insert almost any type of content.

Example

HTML

<div class="dropdown is-active">
  <div class="dropdown-trigger">
    <button class="button" aria-haspopup="true" aria-controls="dropdown-menu2">
      <span>Content</span>
      <span class="icon is-small">
        <i class="fas fa-angle-down" aria-hidden="true"></i>
      </span>
    </button>
  </div>
  <div class="dropdown-menu" id="dropdown-menu2" role="menu">
    <div class="dropdown-content">
      <div class="dropdown-item">
        <p>
          You can insert <strong>any type of content</strong> within the
          dropdown menu.
        </p>
      </div>
      <hr class="dropdown-divider" />
      <div class="dropdown-item">
        <p>You simply need to use a <code>&lt;div&gt;</code> instead.</p>
      </div>
      <hr class="dropdown-divider" />
      <a href="#" class="dropdown-item"> This is a link </a>
    </div>
  </div>
</div>

Hoverable or Toggable
#

The dropdown component has 2 additional modifiers

    is-hoverable: the dropdown will show up when hovering the dropdown-trigger
    is-active: the dropdown will show up all the time

While the CSS :hover implementation works perfectly, the is-active class is available for users who want to control the display of the dropdown with JavaScript.

Example

HTML

<div class="dropdown">
  <div class="dropdown-trigger">
    <button class="button" aria-haspopup="true" aria-controls="dropdown-menu3">
      <span>Click me</span>
      <span class="icon is-small">
        <i class="fas fa-angle-down" aria-hidden="true"></i>
      </span>
    </button>
  </div>
  <div class="dropdown-menu" id="dropdown-menu3" role="menu">
    <div class="dropdown-content">
      <a href="#" class="dropdown-item"> Overview </a>
      <a href="#" class="dropdown-item"> Modifiers </a>
      <a href="#" class="dropdown-item"> Grid </a>
      <a href="#" class="dropdown-item"> Form </a>
      <a href="#" class="dropdown-item"> Elements </a>
      <a href="#" class="dropdown-item"> Components </a>
      <a href="#" class="dropdown-item"> Layout </a>
      <hr class="dropdown-divider" />
      <a href="#" class="dropdown-item"> More </a>
    </div>
  </div>
</div>

Example

HTML

<div class="dropdown is-hoverable">
  <div class="dropdown-trigger">
    <button class="button" aria-haspopup="true" aria-controls="dropdown-menu4">
      <span>Hover me</span>
      <span class="icon is-small">
        <i class="fas fa-angle-down" aria-hidden="true"></i>
      </span>
    </button>
  </div>
  <div class="dropdown-menu" id="dropdown-menu4" role="menu">
    <div class="dropdown-content">
      <div class="dropdown-item">
        <p>
          You can insert <strong>any type of content</strong> within the
          dropdown menu.
        </p>
      </div>
    </div>
  </div>
</div>

Right aligned
#

You can add the is-right modifier to have a right-aligned dropdown.

Example

HTML

<div class="dropdown is-active">
  <div class="dropdown-trigger">
    <button class="button" aria-haspopup="true" aria-controls="dropdown-menu5">
      <span>Left aligned</span>
      <span class="icon is-small">
        <i class="fas fa-angle-down" aria-hidden="true"></i>
      </span>
    </button>
  </div>
  <div class="dropdown-menu" id="dropdown-menu5" role="menu">
    <div class="dropdown-content">
      <div class="dropdown-item">
        <p>The dropdown is <strong>left-aligned</strong> by default.</p>
      </div>
    </div>
  </div>
</div>

Example

HTML

<div class="dropdown is-right is-active">
  <div class="dropdown-trigger">
    <button class="button" aria-haspopup="true" aria-controls="dropdown-menu6">
      <span>Right aligned</span>
      <span class="icon is-small">
        <i class="fas fa-angle-down" aria-hidden="true"></i>
      </span>
    </button>
  </div>
  <div class="dropdown-menu" id="dropdown-menu6" role="menu">
    <div class="dropdown-content">
      <div class="dropdown-item">
        <p>
          Add the <code>is-right</code> modifier for a
          <strong>right-aligned</strong> dropdown.
        </p>
      </div>
    </div>
  </div>
</div>

Dropup
#

You can add the is-up modifier to have a dropdown menu that appears above the dropdown button.

Example

HTML

<div class="dropdown is-up">
  <div class="dropdown-trigger">
    <button class="button" aria-haspopup="true" aria-controls="dropdown-menu7">
      <span>Dropup button</span>
      <span class="icon is-small">
        <i class="fas fa-angle-up" aria-hidden="true"></i>
      </span>
    </button>
  </div>
  <div class="dropdown-menu" id="dropdown-menu7" role="menu">
    <div class="dropdown-content">
      <div class="dropdown-item">
        <p>
          You can add the <code>is-up</code> modifier to have a dropdown menu
          that appears above the dropdown button.
        </p>
      </div>
    </div>
  </div>
</div>

Sass and CSS variables
#
Sass Variable
	
CSS Variable
	
Value

$dropdown-menu-min-width

var(--bulma-dropdown-menu-min-width)

12rem

$dropdown-content-background-color

var(--bulma-dropdown-content-background-color)

var(--bulma-scheme-main)

$dropdown-content-offset

var(--bulma-dropdown-content-offset)

0.25rem

$dropdown-content-padding-bottom

var(--bulma-dropdown-content-padding-bottom)

0.5rem

$dropdown-content-padding-top

var(--bulma-dropdown-content-padding-top)

0.5rem

$dropdown-content-radius

var(--bulma-dropdown-content-radius)

var(--bulma-radius)

$dropdown-content-shadow

var(--bulma-dropdown-content-shadow)

var(--bulma-shadow)

$dropdown-content-z

var(--bulma-dropdown-content-z)

20

$dropdown-divider-background-color

var(--bulma-dropdown-divider-background-color)

var(--bulma-border-weak)



Card

An all-around flexible and composable component
CSS Masterclass

The card component comprises several elements that you can mix and match:

    card: the main container
        card-header: a horizontal bar with a shadow
            card-header-title: a left-aligned bold text
            card-header-icon: a placeholder for an icon
        card-image: a fullwidth container for a responsive image
        card-content: a multi-purpose container for any other element
        card-footer: a horizontal list of controls
            card-footer-item: a repeatable list item

You can center the card-header-title by appending the is-centered modifier.

Example
Placeholder image
Placeholder image

John Smith

@johnsmith
Lorem ipsum dolor sit amet, consectetur adipiscing elit. Phasellus nec iaculis mauris. @bulmaio. #css #responsive
11:09 PM - 1 Jan 2016

HTML

<div class="card">
  <div class="card-image">
    <figure class="image is-4by3">
      <img
        src="https://bulma.io/assets/images/placeholders/1280x960.png"
        alt="Placeholder image"
      />
    </figure>
  </div>
  <div class="card-content">
    <div class="media">
      <div class="media-left">
        <figure class="image is-48x48">
          <img
            src="https://bulma.io/assets/images/placeholders/96x96.png"
            alt="Placeholder image"
          />
        </figure>
      </div>
      <div class="media-content">
        <p class="title is-4">John Smith</p>
        <p class="subtitle is-6">@johnsmith</p>
      </div>
    </div>

    <div class="content">
      Lorem ipsum dolor sit amet, consectetur adipiscing elit. Phasellus nec
      iaculis mauris. <a>@bulmaio</a>. <a href="#">#css</a>
      <a href="#">#responsive</a>
      <br />
      <time datetime="2016-1-1">11:09 PM - 1 Jan 2016</time>
    </div>
  </div>
</div>

Card parts
#

The card-header can have a title and a Bulma icon:

Example

Card header

HTML

<div class="card">
  <header class="card-header">
    <p class="card-header-title">Card header</p>
    <button class="card-header-icon" aria-label="more options">
      <span class="icon">
        <i class="fas fa-angle-down" aria-hidden="true"></i>
      </span>
    </button>
  </header>
</div>

The card-image is a container for a Bulma image element:

Example
Placeholder image

HTML

<div class="card">
  <div class="card-image">
    <figure class="image is-4by3">
      <img
        src="https://bulma.io/assets/images/placeholders/1280x960.png"
        alt="Placeholder image"
      />
    </figure>
  </div>
</div>

The card-content is the main part, ideal for text content, thanks to its padding:

Example
Lorem ipsum leo risus, porta ac consectetur ac, vestibulum at eros. Donec id elit non mi porta gravida at eget metus. Cum sociis natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus. Cras mattis consectetur purus sit amet fermentum.

HTML

<div class="card">
  <div class="card-content">
    <div class="content">
      Lorem ipsum leo risus, porta ac consectetur ac, vestibulum at eros. Donec
      id elit non mi porta gravida at eget metus. Cum sociis natoque penatibus
      et magnis dis parturient montes, nascetur ridiculus mus. Cras mattis
      consectetur purus sit amet fermentum.
    </div>
  </div>
</div>

The card-footer acts as a list of for several card-footer-item elements:

Example
Save
Edit
Delete

HTML

<div class="card">
  <footer class="card-footer">
    <a href="#" class="card-footer-item">Save</a>
    <a href="#" class="card-footer-item">Edit</a>
    <a href="#" class="card-footer-item">Delete</a>
  </footer>
</div>

Examples
#

Example

Component
Lorem ipsum dolor sit amet, consectetur adipiscing elit. Phasellus nec iaculis mauris. @bulmaio. #css #responsive
11:09 PM - 1 Jan 2016
Save
Edit
Delete

HTML

<div class="card">
  <header class="card-header">
    <p class="card-header-title">Component</p>
    <button class="card-header-icon" aria-label="more options">
      <span class="icon">
        <i class="fas fa-angle-down" aria-hidden="true"></i>
      </span>
    </button>
  </header>
  <div class="card-content">
    <div class="content">
      Lorem ipsum dolor sit amet, consectetur adipiscing elit. Phasellus nec
      iaculis mauris.
      <a href="#">@bulmaio</a>. <a href="#">#css</a> <a href="#">#responsive</a>
      <br />
      <time datetime="2016-1-1">11:09 PM - 1 Jan 2016</time>
    </div>
  </div>
  <footer class="card-footer">
    <a href="#" class="card-footer-item">Save</a>
    <a href="#" class="card-footer-item">Edit</a>
    <a href="#" class="card-footer-item">Delete</a>
  </footer>
</div>

Example

“There are two hard things in computer science: cache invalidation, naming things, and off-by-one errors.”

Jeff Atwood

View on Twitter

Share on Facebook

HTML

<div class="card">
  <div class="card-content">
    <p class="title">
      “There are two hard things in computer science: cache invalidation, naming
      things, and off-by-one errors.”
    </p>
    <p class="subtitle">Jeff Atwood</p>
  </div>
  <footer class="card-footer">
    <p class="card-footer-item">
      <span>
        View on
        <a href="https://twitter.com/codinghorror/status/506010907021828096"
          >Twitter</a
        >
      </span>
    </p>
    <p class="card-footer-item">
      <span> Share on <a href="#">Facebook</a> </span>
    </p>
  </footer>
</div>

Sass and CSS variables
#
Sass Variable
	
CSS Variable
	
Value

$card-color

var(--bulma-card-color)

var(--bulma-text)

$card-background-color

var(--bulma-card-background-color)

var(--bulma-scheme-main)

$card-shadow

var(--bulma-card-shadow)

var(--bulma-shadow)

$card-radius

var(--bulma-card-radius)

0.75rem

$card-header-background-color

var(--bulma-card-header-background-color)

transparent

$card-header-color

var(--bulma-card-header-color)

var(--bulma-text-strong)

$card-header-padding

var(--bulma-card-header-padding)

0.75rem 1rem

$card-header-shadow

var(--bulma-card-header-shadow)

0 0.125em 0.25em hsla(
  var(--bulma-scheme-h),
  var(--bulma-scheme-s),
  var(--bulma-scheme-invert-l),
  0.1
)

$card-header-weight

var(--bulma-card-header-weight)

var(--bulma-weight-bold)

$card-content-background-color

var(--bulma-card-content-background-color)

transparent

$card-content-padding

var(--bulma-card-content-padding)

1.5rem

$card-footer-background-color

var(--bulma-card-footer-background-color)

transparent

$card-footer-border-top

var(--bulma-card-footer-border-top)

1px solid var(--bulma-border-weak)

$card-footer-padding

var(--bulma-card-footer-padding)

0.75rem

$card-media-margin

var(--bulma-card-media-margin)

var(--bulma-block-spacing)



Breadcrumb

A simple breadcrumb component to improve your navigation experience
CSS Masterclass

The Bulma breadcrumb is a simple navigation component that only requires a breadcrumb container and a ul list. The dividers are automatically created in the content of the ::before pseudo-element of li tags.

You can inform the current page using the is-active modifier in a li tag. It will disable the navigation of inner links.

Example

HTML

<nav class="breadcrumb" aria-label="breadcrumbs">
  <ul>
    <li><a href="#">Bulma</a></li>
    <li><a href="#">Documentation</a></li>
    <li><a href="#">Components</a></li>
    <li class="is-active"><a href="#" aria-current="page">Breadcrumb</a></li>
  </ul>
</nav>

Alignment
#

For alternative alignments, use the is-centered and is-right modifiers on the breadcrumb container.

Example

HTML

<nav class="breadcrumb is-centered" aria-label="breadcrumbs">
  <ul>
    <li><a href="#">Bulma</a></li>
    <li><a href="#">Documentation</a></li>
    <li><a href="#">Components</a></li>
    <li class="is-active"><a href="#" aria-current="page">Breadcrumb</a></li>
  </ul>
</nav>

Example

HTML

<nav class="breadcrumb is-right" aria-label="breadcrumbs">
  <ul>
    <li><a href="#">Bulma</a></li>
    <li><a href="#">Documentation</a></li>
    <li><a href="#">Components</a></li>
    <li class="is-active"><a href="#" aria-current="page">Breadcrumb</a></li>
  </ul>
</nav>

Icons
#

You can use any of the Font Awesome icons.

Example

HTML

<nav class="breadcrumb" aria-label="breadcrumbs">
  <ul>
    <li>
      <a href="#">
        <span class="icon is-small">
          <i class="fas fa-home" aria-hidden="true"></i>
        </span>
        <span>Bulma</span>
      </a>
    </li>
    <li>
      <a href="#">
        <span class="icon is-small">
          <i class="fas fa-book" aria-hidden="true"></i>
        </span>
        <span>Documentation</span>
      </a>
    </li>
    <li>
      <a href="#">
        <span class="icon is-small">
          <i class="fas fa-puzzle-piece" aria-hidden="true"></i>
        </span>
        <span>Components</span>
      </a>
    </li>
    <li class="is-active">
      <a href="#">
        <span class="icon is-small">
          <i class="fas fa-thumbs-up" aria-hidden="true"></i>
        </span>
        <span>Breadcrumb</span>
      </a>
    </li>
  </ul>
</nav>

Alternative separators
#

You can choose between 4 additional separators: has-arrow-separator has-bullet-separator has-dot-separator and has-succeeds-separator.

Example

HTML

<nav class="breadcrumb has-arrow-separator" aria-label="breadcrumbs">
  <ul>
    <li><a href="#">Bulma</a></li>
    <li><a href="#">Documentation</a></li>
    <li><a href="#">Components</a></li>
    <li class="is-active"><a href="#" aria-current="page">Breadcrumb</a></li>
  </ul>
</nav>

Example

HTML

<nav class="breadcrumb has-bullet-separator" aria-label="breadcrumbs">
  <ul>
    <li><a href="#">Bulma</a></li>
    <li><a href="#">Documentation</a></li>
    <li><a href="#">Components</a></li>
    <li class="is-active"><a href="#" aria-current="page">Breadcrumb</a></li>
  </ul>
</nav>

Example

HTML

<nav class="breadcrumb has-dot-separator" aria-label="breadcrumbs">
  <ul>
    <li><a href="#">Bulma</a></li>
    <li><a href="#">Documentation</a></li>
    <li><a href="#">Components</a></li>
    <li class="is-active"><a href="#" aria-current="page">Breadcrumb</a></li>
  </ul>
</nav>

Example

HTML

<nav class="breadcrumb has-succeeds-separator" aria-label="breadcrumbs">
  <ul>
    <li><a href="#">Bulma</a></li>
    <li><a href="#">Documentation</a></li>
    <li><a href="#">Components</a></li>
    <li class="is-active"><a href="#" aria-current="page">Breadcrumb</a></li>
  </ul>
</nav>

Sizes
#

You can choose between 3 additional sizes: is-small is-medium and is-large.

Example

HTML

<nav class="breadcrumb is-small" aria-label="breadcrumbs">
  <ul>
    <li><a href="#">Bulma</a></li>
    <li><a href="#">Documentation</a></li>
    <li><a href="#">Components</a></li>
    <li class="is-active"><a href="#" aria-current="page">Breadcrumb</a></li>
  </ul>
</nav>

Example

HTML

<nav class="breadcrumb is-medium" aria-label="breadcrumbs">
  <ul>
    <li><a href="#">Bulma</a></li>
    <li><a href="#">Documentation</a></li>
    <li><a href="#">Components</a></li>
    <li class="is-active"><a href="#" aria-current="page">Breadcrumb</a></li>
  </ul>
</nav>

Example

HTML

<nav class="breadcrumb is-large" aria-label="breadcrumbs">
  <ul>
    <li><a href="#">Bulma</a></li>
    <li><a href="#">Documentation</a></li>
    <li><a href="#">Components</a></li>
    <li class="is-active"><a href="#" aria-current="page">Breadcrumb</a></li>
  </ul>
</nav>

Sass and CSS variables
#
Sass Variable
	
CSS Variable
	
Value

$breadcrumb-item-color

var(--bulma-breadcrumb-item-color)

var(--bulma-link-text)

$breadcrumb-item-hover-color

var(--bulma-breadcrumb-item-hover-color)

var(--bulma-link-text-hover)

$breadcrumb-item-active-color

var(--bulma-breadcrumb-item-active-color)

var(--bulma-link-text-active)

$breadcrumb-item-padding-vertical

var(--bulma-breadcrumb-item-padding-vertical)

0

$breadcrumb-item-padding-horizontal

var(--bulma-breadcrumb-item-padding-horizontal)

0.75em

$breadcrumb-item-separator-color

var(--bulma-breadcrumb-item-separator-color)

var(--bulma-border)



Title and Subtitle

Simple headings to add depth to your page
CSS Masterclass

There are 2 types of heading:

    title
    subtitle

Title

Subtitle

<h1 class="title">Title</h1>
<h2 class="subtitle">Subtitle</h2>

Sizes
#

There are 6 sizes available:

Title 1

Title 2

Title 3 (default size)

Title 4

Title 5

Title 6

<h1 class="title is-1">Title 1</h1>
<h2 class="title is-2">Title 2</h2>
<h3 class="title is-3">Title 3</h3>
<h4 class="title is-4">Title 4</h4>
<h5 class="title is-5">Title 5</h5>
<h6 class="title is-6">Title 6</h6>

Subtitle 1

Subtitle 2

Subtitle 3

Subtitle 4

Subtitle 5 (default size)

Subtitle 6

<h1 class="subtitle is-1">Subtitle 1</h1>
<h2 class="subtitle is-2">Subtitle 2</h2>
<h3 class="subtitle is-3">Subtitle 3</h3>
<h4 class="subtitle is-4">Subtitle 4</h4>
<h5 class="subtitle is-5">Subtitle 5</h5>
<h6 class="subtitle is-6">Subtitle 6</h6>

When you combine a title and a subtitle, they move closer together.

As a rule of thumb, it is recommended to use a size difference of two. So if you use a title is-1, combine it with a subtitle is-3.

Title 1

Subtitle 3

Title 2

Subtitle 4

Title 3

Subtitle 5

<p class="title is-1">Title 1</p>
<p class="subtitle is-3">Subtitle 3</p>

<p class="title is-2">Title 2</p>
<p class="subtitle is-4">Subtitle 4</p>

<p class="title is-3">Title 3</p>
<p class="subtitle is-5">Subtitle 5</p>

You can maintain the normal spacing between titles and subtitles if you use the is-spaced modifier on the first element.

Title 1

Subtitle 3

Title 2

Subtitle 4

Title 3

Subtitle 5

<p class="title is-1 is-spaced">Title 1</p>
<p class="subtitle is-3">Subtitle 3</p>

<p class="title is-2 is-spaced">Title 2</p>
<p class="subtitle is-4">Subtitle 4</p>

<p class="title is-3 is-spaced">Title 3</p>
<p class="subtitle is-5">Subtitle 5</p>

Sass and CSS variables
#
Sass Variable
	
CSS Variable
	
Value

$title-color

var(--bulma-title-color)

var(--bulma-text-strong)

$title-family

var(--bulma-title-family)

false

$title-size

var(--bulma-title-size)

var(--bulma-size-3)

$title-weight

var(--bulma-title-weight)

var(--bulma-weight-extrabold)

$title-line-height

var(--bulma-title-line-height)

1.125

$title-strong-color

var(--bulma-title-strong-color)

inherit

$title-strong-weight

var(--bulma-title-strong-weight)

inherit

$title-sub-size

var(--bulma-title-sub-size)

0.75em

$title-sup-size

var(--bulma-title-sup-size)

0.75em

$subtitle-color

var(--bulma-subtitle-color)

var(--bulma-text)

$subtitle-family

var(--bulma-subtitle-family)

false

$subtitle-size

var(--bulma-subtitle-size)

var(--bulma-size-5)

$subtitle-weight

var(--bulma-subtitle-weight)

var(--bulma-weight-normal)

$subtitle-line-height

var(--bulma-subtitle-line-height)

1.25

$subtitle-strong-color

var(--bulma-subtitle-strong-color)

var(--bulma-text-strong)

$subtitle-strong-weight

var(--bulma-subtitle-strong-weight)

var(--bulma-weight-semibold)



Tags

Small tag labels to insert anywhere
CSS Masterclass

The Bulma tag is a small but versatile element. It's very useful as a way to attach information to a block or other component. Its size makes it also easy to display in numbers, making it appropriate for long lists of items.
By default, a tag is a 1.5rem high label.
Tag label

<span class="tag"> Tag label </span>

Colors
#
Like with buttons, there are 10 different colors available.

Black

Dark

Light

White

Primary

Link

Info

Success

Warning
Danger

<span class="tag is-black">Black</span>
<span class="tag is-dark">Dark</span>
<span class="tag is-light">Light</span>
<span class="tag is-white">White</span>
<span class="tag is-primary">Primary</span>
<span class="tag is-link">Link</span>
<span class="tag is-info">Info</span>
<span class="tag is-success">Success</span>
<span class="tag is-warning">Warning</span>
<span class="tag is-danger">Danger</span>

You can now choose the light version of a color.

Primary

Link

Info

Success

Warning
Danger

<span class="tag is-primary is-light">Primary</span>
<span class="tag is-link is-light">Link</span>
<span class="tag is-info is-light">Info</span>
<span class="tag is-success is-light">Success</span>
<span class="tag is-warning is-light">Warning</span>
<span class="tag is-danger is-light">Danger</span>

Sizes
#

The tag comes in 3 different sizes.

While the default size is the normal one, the is-normal modifier exists in case you need to reset the tag to its normal size.

Normal

Medium

Large

<span class="tag is-link is-normal">Normal</span>
<span class="tag is-primary is-medium">Medium</span>
<span class="tag is-info is-large">Large</span>

You can change the size of all tags at once:

Example
All Medium Size

HTML

<div class="tags are-medium">
  <span class="tag">All</span>
  <span class="tag">Medium</span>
  <span class="tag">Size</span>
</div>

Example
All Large Size

HTML

<div class="tags are-large">
  <span class="tag">All</span>
  <span class="tag">Large</span>
  <span class="tag">Size</span>
</div>

You can however keep the original size of a subset of tags, simply by applying one of its modifier class:

Example
Medium Normal Medium Large Medium

HTML

<div class="tags are-medium">
  <span class="tag">Medium</span>
  <span class="tag is-normal">Normal</span>
  <span class="tag">Medium</span>
  <span class="tag is-large">Large</span>
  <span class="tag">Medium</span>
</div>

Hover/Active state
#

A tag element will react to the :hover and :active states if:

    it's an anchor element <a class="tag">
    it's a button element <button class="tag">
    it has the is-hoverable modifier class <div class="tag is-hoverable">

Example
Hover me
Hover me

HTML

<a class="tag">Hover me</a>
<button class="tag">Hover me</button>
<div class="tag is-hoverable">Hover me</div>

Modifiers
#
You can add the is-rounded modifier to make a rounded tag.
Rounded

<span class="tag is-rounded">Rounded</span>

You can add the is-delete modifier to turn the tag into a delete button.

<a class="tag is-delete"></a>

Combinations
#
You can create hoverable colored tags.
Hover me
Hover me
Hover me
Hover me

<a class="tag is-link">Hover me</a>
<button class="tag is-primary">Hover me</button>
<div class="tag is-hoverable is-success">Hover me</div>
<a class="tag is-info">Hover me</a>
<button class="tag is-warning">Hover me</button>
<div class="tag is-hoverable is-danger">Hover me</div>

You can append a delete button.

Bar
Hello World

<span class="tag is-success">
  Bar
  <button class="delete is-small"></button>
</span>
<span class="tag is-warning is-medium">
  Hello
  <button class="delete is-small"></button>
</span>
<span class="tag is-danger is-large">
  World
  <button class="delete"></button>
</span>

List of tags
#

You can now create a list of tags with the tags container.
One Two Three

<div class="tags">
  <span class="tag">One</span>
  <span class="tag">Two</span>
  <span class="tag">Three</span>
</div>

If the list is very long, it will automatically wrap on multiple lines, while keeping all tags evenly spaced.
One Two Three Four Five Six Seven Eight Nine Ten Eleven Twelve Thirteen Fourteen Fifteen Sixteen Seventeen Eighteen Nineteen Twenty

<div class="tags">
  <span class="tag">One</span>
  <span class="tag">Two</span>
  <span class="tag">Three</span>
  <span class="tag">Four</span>
  <span class="tag">Five</span>
  <span class="tag">Six</span>
  <span class="tag">Seven</span>
  <span class="tag">Eight</span>
  <span class="tag">Nine</span>
  <span class="tag">Ten</span>
  <span class="tag">Eleven</span>
  <span class="tag">Twelve</span>
  <span class="tag">Thirteen</span>
  <span class="tag">Fourteen</span>
  <span class="tag">Fifteen</span>
  <span class="tag">Sixteen</span>
  <span class="tag">Seventeen</span>
  <span class="tag">Eighteen</span>
  <span class="tag">Nineteen</span>
  <span class="tag">Twenty</span>
</div>

Tag addons
#

You can attach tags together with the has-addons modifier.
Package Bulma

<div class="tags has-addons">
  <span class="tag">Package</span>
  <span class="tag is-primary">Bulma</span>
</div>

You can attach a text tag with a delete tag together.
Alex Smith

<div class="tags has-addons">
  <span class="tag is-danger">Alex Smith</span>
  <a class="tag is-delete"></a>
</div>

If you want to attach tags containers together, simply use the field element with the is-grouped and is-grouped-multiline modifiers.
npm 1.0.4
build passing
chat on gitter

<div class="field is-grouped is-grouped-multiline">
  <div class="control">
    <div class="tags has-addons">
      <span class="tag is-dark">npm</span>
      <span class="tag is-info">1.0.4</span>
    </div>
  </div>

  <div class="control">
    <div class="tags has-addons">
      <span class="tag is-dark">build</span>
      <span class="tag is-success">passing</span>
    </div>
  </div>

  <div class="control">
    <div class="tags has-addons">
      <span class="tag is-dark">chat</span>
      <span class="tag is-primary">on gitter</span>
    </div>
  </div>
</div>

This can be useful for a long list of blog tags.
Technology
CSS
Flexbox
Web Design
Open Source
Community
Documentation

<div class="field is-grouped is-grouped-multiline">
  <div class="control">
    <div class="tags has-addons">
      <a class="tag is-link">Technology</a>
      <a class="tag is-delete"></a>
    </div>
  </div>

  <div class="control">
    <div class="tags has-addons">
      <a class="tag is-link">CSS</a>
      <a class="tag is-delete"></a>
    </div>
  </div>

  <div class="control">
    <div class="tags has-addons">
      <a class="tag is-link">Flexbox</a>
      <a class="tag is-delete"></a>
    </div>
  </div>

  <div class="control">
    <div class="tags has-addons">
      <a class="tag is-link">Web Design</a>
      <a class="tag is-delete"></a>
    </div>
  </div>

  <div class="control">
    <div class="tags has-addons">
      <a class="tag is-link">Open Source</a>
      <a class="tag is-delete"></a>
    </div>
  </div>

  <div class="control">
    <div class="tags has-addons">
      <a class="tag is-link">Community</a>
      <a class="tag is-delete"></a>
    </div>
  </div>

  <div class="control">
    <div class="tags has-addons">
      <a class="tag is-link">Documentation</a>
      <a class="tag is-delete"></a>
    </div>
  </div>
</div>

Sass and CSS variables
#
Sass Variable
	
CSS Variable
	
Value

$tag-radius

var(--bulma-tag-radius)

var(--bulma-radius)

$tag-delete-margin

var(--bulma-tag-delete-margin)

1px



Table

The inevitable HTML table, with special case cells
CSS Masterclass

You can create a Bulma table simply by attaching a single table CSS class on a <table> HTML element with the following structure:

    <table class="table"> as the main container
        thead the optional top part of the table
        tfoot the optional bottom part of the table
        tbody the main content of the table
            tr each table row
                th a table cell heading
                td a table cell

You can set a table row as selected by appending the is-selected modifier on a <tr>

Example
Pos 	Team 	Pld 	W 	D 	L 	GF 	GA 	GD 	Pts 	Qualification or relegation
Pos 	Team 	Pld 	W 	D 	L 	GF 	GA 	GD 	Pts 	Qualification or relegation
1 	Leicester City (C) 	38 	23 	12 	3 	68 	36 	+32 	81 	Qualification for the Champions League group stage
2 	Arsenal 	38 	20 	11 	7 	65 	36 	+29 	71 	Qualification for the Champions League group stage
3 	Tottenham Hotspur 	38 	19 	13 	6 	69 	35 	+34 	70 	Qualification for the Champions League group stage
4 	Manchester City 	38 	19 	9 	10 	71 	41 	+30 	66 	Qualification for the Champions League play-off round
5 	Manchester United 	38 	19 	9 	10 	49 	35 	+14 	66 	Qualification for the Europa League group stage
6 	Southampton 	38 	18 	9 	11 	59 	41 	+18 	63 	Qualification for the Europa League group stage
7 	West Ham United 	38 	16 	14 	8 	65 	51 	+14 	62 	Qualification for the Europa League third qualifying round
8 	Liverpool 	38 	16 	12 	10 	63 	50 	+13 	60 	
9 	Stoke City 	38 	14 	9 	15 	41 	55 	−14 	51 	
10 	Chelsea 	38 	12 	14 	12 	59 	53 	+6 	50 	
11 	Everton 	38 	11 	14 	13 	59 	55 	+4 	47 	
12 	Swansea City 	38 	12 	11 	15 	42 	52 	−10 	47 	
13 	Watford 	38 	12 	9 	17 	40 	50 	−10 	45 	
14 	West Bromwich Albion 	38 	10 	13 	15 	34 	48 	−14 	43 	
15 	Crystal Palace 	38 	11 	9 	18 	39 	51 	−12 	42 	
16 	AFC Bournemouth 	38 	11 	9 	18 	45 	67 	−22 	42 	
17 	Sunderland 	38 	9 	12 	17 	48 	62 	−14 	39 	
18 	Newcastle United (R) 	38 	9 	10 	19 	44 	65 	−21 	37 	Relegation to the Football League Championship
19 	Norwich City (R) 	38 	9 	7 	22 	39 	67 	−28 	34 	Relegation to the Football League Championship
20 	Aston Villa (R) 	38 	3 	8 	27 	27 	76 	−49 	17 	Relegation to the Football League Championship

HTML

<table class="table">
  <thead>
    <tr>
      <th><abbr title="Position">Pos</abbr></th>
      <th>Team</th>
      <th><abbr title="Played">Pld</abbr></th>
      <th><abbr title="Won">W</abbr></th>
      <th><abbr title="Drawn">D</abbr></th>
      <th><abbr title="Lost">L</abbr></th>
      <th><abbr title="Goals for">GF</abbr></th>
      <th><abbr title="Goals against">GA</abbr></th>
      <th><abbr title="Goal difference">GD</abbr></th>
      <th><abbr title="Points">Pts</abbr></th>
      <th>Qualification or relegation</th>
    </tr>
  </thead>
  <tfoot>
    <tr>
      <th><abbr title="Position">Pos</abbr></th>
      <th>Team</th>
      <th><abbr title="Played">Pld</abbr></th>
      <th><abbr title="Won">W</abbr></th>
      <th><abbr title="Drawn">D</abbr></th>
      <th><abbr title="Lost">L</abbr></th>
      <th><abbr title="Goals for">GF</abbr></th>
      <th><abbr title="Goals against">GA</abbr></th>
      <th><abbr title="Goal difference">GD</abbr></th>
      <th><abbr title="Points">Pts</abbr></th>
      <th>Qualification or relegation</th>
    </tr>
  </tfoot>
  <tbody>
    <tr>
      <th>1</th>
      <td>
        <a
          href="https://en.wikipedia.org/wiki/Leicester_City_F.C."
          title="Leicester City F.C."
          >Leicester City</a
        >
        <strong>(C)</strong>
      </td>
      <td>38</td>
      <td>23</td>
      <td>12</td>
      <td>3</td>
      <td>68</td>
      <td>36</td>
      <td>+32</td>
      <td>81</td>
      <td>
        Qualification for the
        <a
          href="https://en.wikipedia.org/wiki/2016%E2%80%9317_UEFA_Champions_League#Group_stage"
          title="2016–17 UEFA Champions League"
          >Champions League group stage</a
        >
      </td>
    </tr>
    <tr>
      <th>2</th>
      <td>
        <a
          href="https://en.wikipedia.org/wiki/Arsenal_F.C."
          title="Arsenal F.C."
          >Arsenal</a
        >
      </td>
      <td>38</td>
      <td>20</td>
      <td>11</td>
      <td>7</td>
      <td>65</td>
      <td>36</td>
      <td>+29</td>
      <td>71</td>
      <td>
        Qualification for the
        <a
          href="https://en.wikipedia.org/wiki/2016%E2%80%9317_UEFA_Champions_League#Group_stage"
          title="2016–17 UEFA Champions League"
          >Champions League group stage</a
        >
      </td>
    </tr>
    <tr>
      <th>3</th>
      <td>
        <a
          href="https://en.wikipedia.org/wiki/Tottenham_Hotspur_F.C."
          title="Tottenham Hotspur F.C."
          >Tottenham Hotspur</a
        >
      </td>
      <td>38</td>
      <td>19</td>
      <td>13</td>
      <td>6</td>
      <td>69</td>
      <td>35</td>
      <td>+34</td>
      <td>70</td>
      <td>
        Qualification for the
        <a
          href="https://en.wikipedia.org/wiki/2016%E2%80%9317_UEFA_Champions_League#Group_stage"
          title="2016–17 UEFA Champions League"
          >Champions League group stage</a
        >
      </td>
    </tr>
    <tr class="is-selected">
      <th>4</th>
      <td>
        <a
          href="https://en.wikipedia.org/wiki/Manchester_City_F.C."
          title="Manchester City F.C."
          >Manchester City</a
        >
      </td>
      <td>38</td>
      <td>19</td>
      <td>9</td>
      <td>10</td>
      <td>71</td>
      <td>41</td>
      <td>+30</td>
      <td>66</td>
      <td>
        Qualification for the
        <a
          href="https://en.wikipedia.org/wiki/2016%E2%80%9317_UEFA_Champions_League#Play-off_round"
          title="2016–17 UEFA Champions League"
          >Champions League play-off round</a
        >
      </td>
    </tr>
    <tr>
      <th>5</th>
      <td>
        <a
          href="https://en.wikipedia.org/wiki/Manchester_United_F.C."
          title="Manchester United F.C."
          >Manchester United</a
        >
      </td>
      <td>38</td>
      <td>19</td>
      <td>9</td>
      <td>10</td>
      <td>49</td>
      <td>35</td>
      <td>+14</td>
      <td>66</td>
      <td>
        Qualification for the
        <a
          href="https://en.wikipedia.org/wiki/2016%E2%80%9317_UEFA_Europa_League#Group_stage"
          title="2016–17 UEFA Europa League"
          >Europa League group stage</a
        >
      </td>
    </tr>
    <tr>
      <th>6</th>
      <td>
        <a
          href="https://en.wikipedia.org/wiki/Southampton_F.C."
          title="Southampton F.C."
          >Southampton</a
        >
      </td>
      <td>38</td>
      <td>18</td>
      <td>9</td>
      <td>11</td>
      <td>59</td>
      <td>41</td>
      <td>+18</td>
      <td>63</td>
      <td>
        Qualification for the
        <a
          href="https://en.wikipedia.org/wiki/2016%E2%80%9317_UEFA_Europa_League#Group_stage"
          title="2016–17 UEFA Europa League"
          >Europa League group stage</a
        >
      </td>
    </tr>
    <tr>
      <th>7</th>
      <td>
        <a
          href="https://en.wikipedia.org/wiki/West_Ham_United_F.C."
          title="West Ham United F.C."
          >West Ham United</a
        >
      </td>
      <td>38</td>
      <td>16</td>
      <td>14</td>
      <td>8</td>
      <td>65</td>
      <td>51</td>
      <td>+14</td>
      <td>62</td>
      <td>
        Qualification for the
        <a
          href="https://en.wikipedia.org/wiki/2016%E2%80%9317_UEFA_Europa_League#Third_qualifying_round"
          title="2016–17 UEFA Europa League"
          >Europa League third qualifying round</a
        >
      </td>
    </tr>
    <tr>
      <th>8</th>
      <td>
        <a
          href="https://en.wikipedia.org/wiki/Liverpool_F.C."
          title="Liverpool F.C."
          >Liverpool</a
        >
      </td>
      <td>38</td>
      <td>16</td>
      <td>12</td>
      <td>10</td>
      <td>63</td>
      <td>50</td>
      <td>+13</td>
      <td>60</td>
      <td></td>
    </tr>
    <tr>
      <th>9</th>
      <td>
        <a
          href="https://en.wikipedia.org/wiki/Stoke_City_F.C."
          title="Stoke City F.C."
          >Stoke City</a
        >
      </td>
      <td>38</td>
      <td>14</td>
      <td>9</td>
      <td>15</td>
      <td>41</td>
      <td>55</td>
      <td>−14</td>
      <td>51</td>
      <td></td>
    </tr>
    <tr>
      <th>10</th>
      <td>
        <a
          href="https://en.wikipedia.org/wiki/Chelsea_F.C."
          title="Chelsea F.C."
          >Chelsea</a
        >
      </td>
      <td>38</td>
      <td>12</td>
      <td>14</td>
      <td>12</td>
      <td>59</td>
      <td>53</td>
      <td>+6</td>
      <td>50</td>
      <td></td>
    </tr>
    <tr>
      <th>11</th>
      <td>
        <a
          href="https://en.wikipedia.org/wiki/Everton_F.C."
          title="Everton F.C."
          >Everton</a
        >
      </td>
      <td>38</td>
      <td>11</td>
      <td>14</td>
      <td>13</td>
      <td>59</td>
      <td>55</td>
      <td>+4</td>
      <td>47</td>
      <td></td>
    </tr>
    <tr>
      <th>12</th>
      <td>
        <a
          href="https://en.wikipedia.org/wiki/Swansea_City_A.F.C."
          title="Swansea City A.F.C."
          >Swansea City</a
        >
      </td>
      <td>38</td>
      <td>12</td>
      <td>11</td>
      <td>15</td>
      <td>42</td>
      <td>52</td>
      <td>−10</td>
      <td>47</td>
      <td></td>
    </tr>
    <tr>
      <th>13</th>
      <td>
        <a
          href="https://en.wikipedia.org/wiki/Watford_F.C."
          title="Watford F.C."
          >Watford</a
        >
      </td>
      <td>38</td>
      <td>12</td>
      <td>9</td>
      <td>17</td>
      <td>40</td>
      <td>50</td>
      <td>−10</td>
      <td>45</td>
      <td></td>
    </tr>
    <tr>
      <th>14</th>
      <td>
        <a
          href="https://en.wikipedia.org/wiki/West_Bromwich_Albion_F.C."
          title="West Bromwich Albion F.C."
          >West Bromwich Albion</a
        >
      </td>
      <td>38</td>
      <td>10</td>
      <td>13</td>
      <td>15</td>
      <td>34</td>
      <td>48</td>
      <td>−14</td>
      <td>43</td>
      <td></td>
    </tr>
    <tr>
      <th>15</th>
      <td>
        <a
          href="https://en.wikipedia.org/wiki/Crystal_Palace_F.C."
          title="Crystal Palace F.C."
          >Crystal Palace</a
        >
      </td>
      <td>38</td>
      <td>11</td>
      <td>9</td>
      <td>18</td>
      <td>39</td>
      <td>51</td>
      <td>−12</td>
      <td>42</td>
      <td></td>
    </tr>
    <tr>
      <th>16</th>
      <td>
        <a
          href="https://en.wikipedia.org/wiki/A.F.C._Bournemouth"
          title="A.F.C. Bournemouth"
          >AFC Bournemouth</a
        >
      </td>
      <td>38</td>
      <td>11</td>
      <td>9</td>
      <td>18</td>
      <td>45</td>
      <td>67</td>
      <td>−22</td>
      <td>42</td>
      <td></td>
    </tr>
    <tr>
      <th>17</th>
      <td>
        <a
          href="https://en.wikipedia.org/wiki/Sunderland_A.F.C."
          title="Sunderland A.F.C."
          >Sunderland</a
        >
      </td>
      <td>38</td>
      <td>9</td>
      <td>12</td>
      <td>17</td>
      <td>48</td>
      <td>62</td>
      <td>−14</td>
      <td>39</td>
      <td></td>
    </tr>
    <tr>
      <th>18</th>
      <td>
        <a
          href="https://en.wikipedia.org/wiki/Newcastle_United_F.C."
          title="Newcastle United F.C."
          >Newcastle United</a
        >
        <strong>(R)</strong>
      </td>
      <td>38</td>
      <td>9</td>
      <td>10</td>
      <td>19</td>
      <td>44</td>
      <td>65</td>
      <td>−21</td>
      <td>37</td>
      <td>
        Relegation to the
        <a
          href="https://en.wikipedia.org/wiki/2016%E2%80%9317_Football_League_Championship"
          title="2016–17 Football League Championship"
          >Football League Championship</a
        >
      </td>
    </tr>
    <tr>
      <th>19</th>
      <td>
        <a
          href="https://en.wikipedia.org/wiki/Norwich_City_F.C."
          title="Norwich City F.C."
          >Norwich City</a
        >
        <strong>(R)</strong>
      </td>
      <td>38</td>
      <td>9</td>
      <td>7</td>
      <td>22</td>
      <td>39</td>
      <td>67</td>
      <td>−28</td>
      <td>34</td>
      <td>
        Relegation to the
        <a
          href="https://en.wikipedia.org/wiki/2016%E2%80%9317_Football_League_Championship"
          title="2016–17 Football League Championship"
          >Football League Championship</a
        >
      </td>
    </tr>
    <tr>
      <th>20</th>
      <td>
        <a
          href="https://en.wikipedia.org/wiki/Aston_Villa_F.C."
          title="Aston Villa F.C."
          >Aston Villa</a
        >
        <strong>(R)</strong>
      </td>
      <td>38</td>
      <td>3</td>
      <td>8</td>
      <td>27</td>
      <td>27</td>
      <td>76</td>
      <td>−49</td>
      <td>17</td>
      <td>
        Relegation to the
        <a
          href="https://en.wikipedia.org/wiki/2016%E2%80%9317_Football_League_Championship"
          title="2016–17 Football League Championship"
          >Football League Championship</a
        >
      </td>
    </tr>
  </tbody>
</table>

Colors
#

You can change the color of a single <td> or <th> cell, or a whole <tr> row, by adding one of the color modifiers:

    is-primary
    is-link
    is-info
    is-success
    is-warning
    is-danger
    is-black
    is-dark
    is-light
    is-white

Example
Link th cell 	Two 	Link td cell 	Four 	Five
Link row 	Two 	Three 	Four 	Five
Primary th cell 	Two 	Primary td cell 	Four 	Five
Primary row 	Two 	Three 	Four 	Five
Info th cell 	Two 	Info td cell 	Four 	Five
Info row 	Two 	Three 	Four 	Five
Success th cell 	Two 	Success td cell 	Four 	Five
Success row 	Two 	Three 	Four 	Five
Warning th cell 	Two 	Warning td cell 	Four 	Five
Warning row 	Two 	Three 	Four 	Five
Danger th cell 	Two 	Danger td cell 	Four 	Five
Danger row 	Two 	Three 	Four 	Five

HTML

<table class="table is-bordered">
  <tbody>
    
      <tr>
        <th class="is-link">Link th cell</th>
        <td>Two</td>
        <td class="is-link">Link td cell</td>
        <td>Four</td>
        <td>Five</td>
      </tr>
      <tr class="is-link">
        <th>Link row</th>
        <td>Two</td>
        <td>Three</td>
        <td>Four</td>
        <td>Five</td>
      </tr>
    
      <tr>
        <th class="is-primary">Primary th cell</th>
        <td>Two</td>
        <td class="is-primary">Primary td cell</td>
        <td>Four</td>
        <td>Five</td>
      </tr>
      <tr class="is-primary">
        <th>Primary row</th>
        <td>Two</td>
        <td>Three</td>
        <td>Four</td>
        <td>Five</td>
      </tr>
    
      <tr>
        <th class="is-info">Info th cell</th>
        <td>Two</td>
        <td class="is-info">Info td cell</td>
        <td>Four</td>
        <td>Five</td>
      </tr>
      <tr class="is-info">
        <th>Info row</th>
        <td>Two</td>
        <td>Three</td>
        <td>Four</td>
        <td>Five</td>
      </tr>
    
      <tr>
        <th class="is-success">Success th cell</th>
        <td>Two</td>
        <td class="is-success">Success td cell</td>
        <td>Four</td>
        <td>Five</td>
      </tr>
      <tr class="is-success">
        <th>Success row</th>
        <td>Two</td>
        <td>Three</td>
        <td>Four</td>
        <td>Five</td>
      </tr>
    
      <tr>
        <th class="is-warning">Warning th cell</th>
        <td>Two</td>
        <td class="is-warning">Warning td cell</td>
        <td>Four</td>
        <td>Five</td>
      </tr>
      <tr class="is-warning">
        <th>Warning row</th>
        <td>Two</td>
        <td>Three</td>
        <td>Four</td>
        <td>Five</td>
      </tr>
    
      <tr>
        <th class="is-danger">Danger th cell</th>
        <td>Two</td>
        <td class="is-danger">Danger td cell</td>
        <td>Four</td>
        <td>Five</td>
      </tr>
      <tr class="is-danger">
        <th>Danger row</th>
        <td>Two</td>
        <td>Three</td>
        <td>Four</td>
        <td>Five</td>
      </tr>
    
  </tbody>
</table>

Modifiers
#

Add borders to all the cells.
table is-bordered
One 	Two
Three 	Four

Add stripes to the table.
table is-striped
One 	Two
Three 	Four
Five 	Six
Seven 	Eight
Nine 	Ten
Eleven 	Twelve

Make the cells narrower.
table is-narrow
One 	Two
Three 	Four
Five 	Six
Seven 	Eight
Nine 	Ten
Eleven 	Twelve

You can add a hover effect on each row
table is-hoverable
One 	Two
Three 	Four
Five 	Six
Seven 	Eight
Nine 	Ten
Eleven 	Twelve

You can have a fullwidth table.
table is-fullwidth
One 	Two
Three 	Four
Five 	Six
Seven 	Eight
Nine 	Ten
Eleven 	Twelve

You can combine all five modifiers.
table is-bordered is-striped is-narrow is-hoverable is-fullwidth
One 	Two
Three 	Four
Five 	Six
Seven 	Eight
Nine 	Ten
Eleven 	Twelve
Table container
#

You can create a scrollable table by wrapping a table in a table-container element:

<div class="table-container">
  <table class="table">
    <!-- Your table content -->
  </table>
</div>

1 	2 	3 	4 	5 	6 	7 	8 	9 	10 	11 	12 	13 	14 	15 	16 	17 	18 	19 	20 	21 	22 	23 	24 	25 	26 	27 	28 	29 	30 	31 	32 	33 	34 	35 	36 	37 	38 	39 	40 	41 	42 	43 	44 	45 	46 	47 	48 	49 	50 	51 	52 	53 	54 	55 	56 	57 	58 	59 	60 	61 	62 	63 	64 	65 	66 	67 	68 	69 	70 	71 	72 	73 	74 	75 	76 	77 	78 	79 	80 	81 	82 	83 	84 	85 	86 	87 	88 	89 	90 	91 	92 	93 	94 	95 	96 	97 	98 	99 	100
2 	4 	6 	8 	10 	12 	14 	16 	18 	20 	22 	24 	26 	28 	30 	32 	34 	36 	38 	40 	42 	44 	46 	48 	50 	52 	54 	56 	58 	60 	62 	64 	66 	68 	70 	72 	74 	76 	78 	80 	82 	84 	86 	88 	90 	92 	94 	96 	98 	100 	102 	104 	106 	108 	110 	112 	114 	116 	118 	120 	122 	124 	126 	128 	130 	132 	134 	136 	138 	140 	142 	144 	146 	148 	150 	152 	154 	156 	158 	160 	162 	164 	166 	168 	170 	172 	174 	176 	178 	180 	182 	184 	186 	188 	190 	192 	194 	196 	198 	200
3 	6 	9 	12 	15 	18 	21 	24 	27 	30 	33 	36 	39 	42 	45 	48 	51 	54 	57 	60 	63 	66 	69 	72 	75 	78 	81 	84 	87 	90 	93 	96 	99 	102 	105 	108 	111 	114 	117 	120 	123 	126 	129 	132 	135 	138 	141 	144 	147 	150 	153 	156 	159 	162 	165 	168 	171 	174 	177 	180 	183 	186 	189 	192 	195 	198 	201 	204 	207 	210 	213 	216 	219 	222 	225 	228 	231 	234 	237 	240 	243 	246 	249 	252 	255 	258 	261 	264 	267 	270 	273 	276 	279 	282 	285 	288 	291 	294 	297 	300
4 	8 	12 	16 	20 	24 	28 	32 	36 	40 	44 	48 	52 	56 	60 	64 	68 	72 	76 	80 	84 	88 	92 	96 	100 	104 	108 	112 	116 	120 	124 	128 	132 	136 	140 	144 	148 	152 	156 	160 	164 	168 	172 	176 	180 	184 	188 	192 	196 	200 	204 	208 	212 	216 	220 	224 	228 	232 	236 	240 	244 	248 	252 	256 	260 	264 	268 	272 	276 	280 	284 	288 	292 	296 	300 	304 	308 	312 	316 	320 	324 	328 	332 	336 	340 	344 	348 	352 	356 	360 	364 	368 	372 	376 	380 	384 	388 	392 	396 	400
5 	10 	15 	20 	25 	30 	35 	40 	45 	50 	55 	60 	65 	70 	75 	80 	85 	90 	95 	100 	105 	110 	115 	120 	125 	130 	135 	140 	145 	150 	155 	160 	165 	170 	175 	180 	185 	190 	195 	200 	205 	210 	215 	220 	225 	230 	235 	240 	245 	250 	255 	260 	265 	270 	275 	280 	285 	290 	295 	300 	305 	310 	315 	320 	325 	330 	335 	340 	345 	350 	355 	360 	365 	370 	375 	380 	385 	390 	395 	400 	405 	410 	415 	420 	425 	430 	435 	440 	445 	450 	455 	460 	465 	470 	475 	480 	485 	490 	495 	500
Sass and CSS variables
#
Sass Variable
	
CSS Variable
	
Value

$table-color

var(--bulma-table-color)

var(--bulma-text-strong)

$table-background-color

var(--bulma-table-background-color)

var(--bulma-scheme-main)

$table-cell-border-color

var(--bulma-table-cell-border-color)

var(--bulma-border)

$table-cell-border-style

var(--bulma-table-cell-border-style)

solid

$table-cell-border-width

var(--bulma-table-cell-border-width)

0 0 1px

$table-cell-padding

var(--bulma-table-cell-padding)

0.5em 0.75em

$table-cell-heading-color

var(--bulma-table-cell-heading-color)

var(--bulma-text-strong)

$table-cell-text-align

var(--bulma-table-cell-text-align)

left

$table-head-cell-border-width

var(--bulma-table-head-cell-border-width)

0 0 2px

$table-head-cell-color

var(--bulma-table-head-cell-color)

var(--bulma-text-strong)

$table-foot-cell-border-width

var(--bulma-table-foot-cell-border-width)

2px 0 0

$table-foot-cell-color

var(--bulma-table-foot-cell-color)

var(--bulma-text-strong)

$table-head-background-color

var(--bulma-table-head-background-color)

transparent

$table-body-background-color

var(--bulma-table-body-background-color)

transparent

$table-foot-background-color

var(--bulma-table-foot-background-color)

transparent

$table-row-hover-background-color

var(--bulma-table-row-hover-background-color)

var(--bulma-scheme-main-bis)

$table-row-active-background-color

var(--bulma-table-row-active-background-color)

var(--bulma-primary)

$table-row-active-color

var(--bulma-table-row-active-color)

var(--bulma-primary-invert)

$table-striped-row-even-background-color

var(--bulma-table-striped-row-even-background-color)

var(--bulma-scheme-main-bis)

$table-striped-row-even-hover-background-color

var(--bulma-table-striped-row-even-hover-background-color)

var(--bulma-scheme-main-ter)



Progress Bar

Native HTML progress bars
CSS Masterclass

The Bulma progress bar is a simple CSS class that styles the native <progress> HTML element.

Example
15%

HTML

<progress class="progress" value="15" max="100">15%</progress>

Colors
#

The progress bar element is available in all the different colors defined by the $colors Sass map.

Example
15%

HTML

 
<progress class="progress is-link" value="15" max="100">
  15%
</progress>

Example
30%

HTML

 
<progress class="progress is-primary" value="30" max="100">
  30%
</progress>

Example
45%

HTML

 
<progress class="progress is-info" value="45" max="100">
  45%
</progress>

Example
60%

HTML

 
<progress class="progress is-success" value="60" max="100">
  60%
</progress>

Example
75%

HTML

 
<progress class="progress is-warning" value="75" max="100">
  75%
</progress>

Example
90%

HTML

 
<progress class="progress is-danger" value="90" max="100">
  90%
</progress>

Sizes
#

Example
20%

HTML

 
<progress class="progress is-small" value="20" max="100">
  20%
</progress>

Example
40%

HTML

 
<progress class="progress is-normal" value="40" max="100">
  40%
</progress>

Example
60%

HTML

 
<progress class="progress is-medium" value="60" max="100">
  60%
</progress>

Example
80%

HTML

 
<progress class="progress is-large" value="80" max="100">
  80%
</progress>

Indeterminate
#

If you don't set the HTML value attribute, you can display an indeterminate progress bar. It's used to show that some progress is going on, but the total duration is not yet determined.

Example
15%
30%
45%
60%

HTML

<progress class="progress is-small is-primary" max="100">15%</progress>
<progress class="progress is-danger" max="100">30%</progress>
<progress class="progress is-medium is-dark" max="100">45%</progress>
<progress class="progress is-large is-info" max="100">60%</progress>

Sass and CSS variables
#
Sass Variable
	
CSS Variable
	
Value

$progress-bar-background-color

var(--bulma-progress-bar-background-color)

var(--bulma-border-weak)

$progress-value-background-color

var(--bulma-progress-value-background-color)

var(--bulma-text)

$progress-border-radius

var(--bulma-progress-border-radius)

var(--bulma-radius-rounded)

$progress-indeterminate-duration

var(--bulma-progress-indeterminate-duration)

1.5s



Notification

Bold notification blocks, to alert your users of something
CSS Masterclass

The notification is a simple colored block meant to draw the attention to the user about something. As such, it can be used as a pinned notification in the corner of the viewport. That's why it supports the use of the delete element.

Example
Lorem ipsum dolor sit amet, consectetur adipiscing elit lorem ipsum dolor. Pellentesque risus mi, tempus quis placerat ut, porta nec nulla. Vestibulum rhoncus ac ex sit amet fringilla. Nullam gravida purus diam, et dictum felis venenatis efficitur.

HTML

<div class="notification">
  <button class="delete"></button>
  Lorem ipsum dolor sit amet, consectetur adipiscing elit lorem ipsum dolor.
  <strong>Pellentesque risus mi</strong>, tempus quis placerat ut, porta nec
  nulla. Vestibulum rhoncus ac ex sit amet fringilla. Nullam gravida purus diam,
  et dictum <a>felis venenatis</a> efficitur.
</div>

Colors
#

The notification element is available in all the different colors defined by the $colors Sass map.

Example
Primar lorem ipsum dolor sit amet, consectetur adipiscing elit lorem ipsum dolor. Pellentesque risus mi, tempus quis placerat ut, porta nec nulla. Vestibulum rhoncus ac ex sit amet fringilla. Nullam gravida purus diam, et dictum felis venenatis efficitur.

HTML

<div class="notification is-link">
  <button class="delete"></button>
  Primar lorem ipsum dolor sit amet, consectetur adipiscing elit lorem ipsum
  dolor. <strong>Pellentesque risus mi</strong>, tempus quis placerat ut, porta
  nec nulla. Vestibulum rhoncus ac ex sit amet fringilla. Nullam gravida purus
  diam, et dictum <a>felis venenatis</a> efficitur.
</div>

Example
Primar lorem ipsum dolor sit amet, consectetur adipiscing elit lorem ipsum dolor. Pellentesque risus mi, tempus quis placerat ut, porta nec nulla. Vestibulum rhoncus ac ex sit amet fringilla. Nullam gravida purus diam, et dictum felis venenatis efficitur.

HTML

<div class="notification is-primary">
  <button class="delete"></button>
  Primar lorem ipsum dolor sit amet, consectetur adipiscing elit lorem ipsum
  dolor. <strong>Pellentesque risus mi</strong>, tempus quis placerat ut, porta
  nec nulla. Vestibulum rhoncus ac ex sit amet fringilla. Nullam gravida purus
  diam, et dictum <a>felis venenatis</a> efficitur.
</div>

Example
Primar lorem ipsum dolor sit amet, consectetur adipiscing elit lorem ipsum dolor. Pellentesque risus mi, tempus quis placerat ut, porta nec nulla. Vestibulum rhoncus ac ex sit amet fringilla. Nullam gravida purus diam, et dictum felis venenatis efficitur.

HTML

<div class="notification is-info">
  <button class="delete"></button>
  Primar lorem ipsum dolor sit amet, consectetur adipiscing elit lorem ipsum
  dolor. <strong>Pellentesque risus mi</strong>, tempus quis placerat ut, porta
  nec nulla. Vestibulum rhoncus ac ex sit amet fringilla. Nullam gravida purus
  diam, et dictum <a>felis venenatis</a> efficitur.
</div>

Example
Primar lorem ipsum dolor sit amet, consectetur adipiscing elit lorem ipsum dolor. Pellentesque risus mi, tempus quis placerat ut, porta nec nulla. Vestibulum rhoncus ac ex sit amet fringilla. Nullam gravida purus diam, et dictum felis venenatis efficitur.

HTML

<div class="notification is-success">
  <button class="delete"></button>
  Primar lorem ipsum dolor sit amet, consectetur adipiscing elit lorem ipsum
  dolor. <strong>Pellentesque risus mi</strong>, tempus quis placerat ut, porta
  nec nulla. Vestibulum rhoncus ac ex sit amet fringilla. Nullam gravida purus
  diam, et dictum <a>felis venenatis</a> efficitur.
</div>

Example
Primar lorem ipsum dolor sit amet, consectetur adipiscing elit lorem ipsum dolor. Pellentesque risus mi, tempus quis placerat ut, porta nec nulla. Vestibulum rhoncus ac ex sit amet fringilla. Nullam gravida purus diam, et dictum felis venenatis efficitur.

HTML

<div class="notification is-warning">
  <button class="delete"></button>
  Primar lorem ipsum dolor sit amet, consectetur adipiscing elit lorem ipsum
  dolor. <strong>Pellentesque risus mi</strong>, tempus quis placerat ut, porta
  nec nulla. Vestibulum rhoncus ac ex sit amet fringilla. Nullam gravida purus
  diam, et dictum <a>felis venenatis</a> efficitur.
</div>

Example
Primar lorem ipsum dolor sit amet, consectetur adipiscing elit lorem ipsum dolor. Pellentesque risus mi, tempus quis placerat ut, porta nec nulla. Vestibulum rhoncus ac ex sit amet fringilla. Nullam gravida purus diam, et dictum felis venenatis efficitur.

HTML

<div class="notification is-danger">
  <button class="delete"></button>
  Primar lorem ipsum dolor sit amet, consectetur adipiscing elit lorem ipsum
  dolor. <strong>Pellentesque risus mi</strong>, tempus quis placerat ut, porta
  nec nulla. Vestibulum rhoncus ac ex sit amet fringilla. Nullam gravida purus
  diam, et dictum <a>felis venenatis</a> efficitur.
</div>

Light colors
#
Each color also comes in its light version. Simply append the is-light modifier to obtain the light version of the notification.

Example
Primar lorem ipsum dolor sit amet, consectetur adipiscing elit lorem ipsum dolor. Pellentesque risus mi, tempus quis placerat ut, porta nec nulla. Vestibulum rhoncus ac ex sit amet fringilla. Nullam gravida purus diam, et dictum felis venenatis efficitur.

HTML

<div class="notification is-link is-light">
  <button class="delete"></button>
  Primar lorem ipsum dolor sit amet, consectetur adipiscing elit lorem ipsum
  dolor. <strong>Pellentesque risus mi</strong>, tempus quis placerat ut, porta
  nec nulla. Vestibulum rhoncus ac ex sit amet fringilla. Nullam gravida purus
  diam, et dictum <a>felis venenatis</a> efficitur.
</div>

Example
Primar lorem ipsum dolor sit amet, consectetur adipiscing elit lorem ipsum dolor. Pellentesque risus mi, tempus quis placerat ut, porta nec nulla. Vestibulum rhoncus ac ex sit amet fringilla. Nullam gravida purus diam, et dictum felis venenatis efficitur.

HTML

<div class="notification is-primary is-light">
  <button class="delete"></button>
  Primar lorem ipsum dolor sit amet, consectetur adipiscing elit lorem ipsum
  dolor. <strong>Pellentesque risus mi</strong>, tempus quis placerat ut, porta
  nec nulla. Vestibulum rhoncus ac ex sit amet fringilla. Nullam gravida purus
  diam, et dictum <a>felis venenatis</a> efficitur.
</div>

Example
Primar lorem ipsum dolor sit amet, consectetur adipiscing elit lorem ipsum dolor. Pellentesque risus mi, tempus quis placerat ut, porta nec nulla. Vestibulum rhoncus ac ex sit amet fringilla. Nullam gravida purus diam, et dictum felis venenatis efficitur.

HTML

<div class="notification is-info is-light">
  <button class="delete"></button>
  Primar lorem ipsum dolor sit amet, consectetur adipiscing elit lorem ipsum
  dolor. <strong>Pellentesque risus mi</strong>, tempus quis placerat ut, porta
  nec nulla. Vestibulum rhoncus ac ex sit amet fringilla. Nullam gravida purus
  diam, et dictum <a>felis venenatis</a> efficitur.
</div>

Example
Primar lorem ipsum dolor sit amet, consectetur adipiscing elit lorem ipsum dolor. Pellentesque risus mi, tempus quis placerat ut, porta nec nulla. Vestibulum rhoncus ac ex sit amet fringilla. Nullam gravida purus diam, et dictum felis venenatis efficitur.

HTML

<div class="notification is-success is-light">
  <button class="delete"></button>
  Primar lorem ipsum dolor sit amet, consectetur adipiscing elit lorem ipsum
  dolor. <strong>Pellentesque risus mi</strong>, tempus quis placerat ut, porta
  nec nulla. Vestibulum rhoncus ac ex sit amet fringilla. Nullam gravida purus
  diam, et dictum <a>felis venenatis</a> efficitur.
</div>

Example
Primar lorem ipsum dolor sit amet, consectetur adipiscing elit lorem ipsum dolor. Pellentesque risus mi, tempus quis placerat ut, porta nec nulla. Vestibulum rhoncus ac ex sit amet fringilla. Nullam gravida purus diam, et dictum felis venenatis efficitur.

HTML

<div class="notification is-warning is-light">
  <button class="delete"></button>
  Primar lorem ipsum dolor sit amet, consectetur adipiscing elit lorem ipsum
  dolor. <strong>Pellentesque risus mi</strong>, tempus quis placerat ut, porta
  nec nulla. Vestibulum rhoncus ac ex sit amet fringilla. Nullam gravida purus
  diam, et dictum <a>felis venenatis</a> efficitur.
</div>

Example
Primar lorem ipsum dolor sit amet, consectetur adipiscing elit lorem ipsum dolor. Pellentesque risus mi, tempus quis placerat ut, porta nec nulla. Vestibulum rhoncus ac ex sit amet fringilla. Nullam gravida purus diam, et dictum felis venenatis efficitur.

HTML

<div class="notification is-danger is-light">
  <button class="delete"></button>
  Primar lorem ipsum dolor sit amet, consectetur adipiscing elit lorem ipsum
  dolor. <strong>Pellentesque risus mi</strong>, tempus quis placerat ut, porta
  nec nulla. Vestibulum rhoncus ac ex sit amet fringilla. Nullam gravida purus
  diam, et dictum <a>felis venenatis</a> efficitur.
</div>

JavaScript example
#

The Bulma package does not come with any JavaScript. Here is however an implementation example, which sets the click handler for Bulma delete elements, anywhere on the page, in vanilla JavaScript.

<div class="notification">
  <button class="delete"></button>
  Lorem ipsum
</div>

document.addEventListener('DOMContentLoaded', () => {
  (document.querySelectorAll('.notification .delete') || []).forEach(($delete) => {
    const $notification = $delete.parentNode;

    $delete.addEventListener('click', () => {
      $notification.parentNode.removeChild($notification);
    });
  });
});

Sass and CSS variables
#
Sass Variable
	
CSS Variable
	
Value

$notification-code-background-color

var(--bulma-notification-code-background-color)

var(--bulma-scheme-main)

$notification-radius

var(--bulma-notification-radius)

var(--bulma-radius)

$notification-padding

var(--bulma-notification-padding)

1.375em 1.5em



Image

A container for responsive images
CSS Masterclass

Because images can take a few seconds to load (or not at all), use the image container to specify a precisely sized container so that your layout isn't broken because of image loading or image errors.

Example

HTML

<figure class="image is-128x128">
  <img src="https://bulma.io/assets/images/placeholders/128x128.png" />
</figure>

Fixed square images
#

There are 7 dimensions to choose from, useful for avatars:
image is-16x16 	
	16x16px
image is-24x24 	
	24x24px
image is-32x32 	
	32x32px
image is-48x48 	
	48x48px
image is-64x64 	
	64x64px
image is-96x96 	
	96x96px
image is-128x128 	
	128x128px
Rounded images
#

You can also make rounded images, using is-rounded class:

Example

HTML

<figure class="image is-128x128">
  <img class="is-rounded" src="https://bulma.io/assets/images/placeholders/128x128.png" />
</figure>

Retina images
#

Because the image is fixed in size, you can use an image that is four times as big. So for example, in a 128x128 container, you can use a 256x256 image, but resized to 128x128 pixels.

Example

HTML

<figure class="image is-128x128">
  <img src="https://bulma.io/assets/images/placeholders/256x256.png" />
</figure>

Responsive images with ratios
#

If you don't know the exact dimensions but know the ratio instead, you can use one of the 16 ratio modifiers, which include common aspect ratios in still photography:
image is-square 	
	Square (or 1 by 1)
image is-1by1 	
	1 by 1
image is-5by4 	
	5 by 4
image is-4by3 	
	4 by 3
image is-3by2 	
	3 by 2
image is-5by3 	
	5 by 3
image is-16by9 	
	16 by 9
image is-2by1 	
	2 by 1
image is-3by1 	
	3 by 1
image is-4by5 	
	4 by 5
image is-3by4 	
	3 by 4
image is-2by3 	
	2 by 3
image is-3by5 	
	3 by 5
image is-9by16 	
	9 by 16
image is-1by2 	
	1 by 2
image is-1by3 	
	1 by 3

The only requirement is for the parent element to already have a specific width.

The image container will usually take up the whole width while maintaining the perfect ratio.
If it doesn't, you can force it by appending the is-fullwidth modifier.
Arbitrary ratios with any element
#

You can apply a specific ratio on any element other than an img, simply by applying the has-ratio modifier to a resizable element.

For example, you can apply a 16by9 ratio on an iframe. Resize the browser, and you'll see how the ratio is maintained.

Example

HTML

<figure class="image is-16by9">
  <iframe
    class="has-ratio"
    width="640"
    height="360"
    src="https://www.youtube.com/embed/YE7VzlLtp-4"
    frameborder="0"
    allowfullscreen
  ></iframe>
</figure>

Sass and CSS variables
#
Sass Variable
	
Value

$dimensions

16 24 32 48 64 96 128



Icon

Compatible with all icon font libraries, including Font Awesome 5
CSS Masterclass

The icon element is a container for any type of icon font. Because the icons can take a few seconds to load, and because you want control over the space the icons will take, you can use the icon class as a reliable square container that will prevent the page to "jump" on page load.

Example

HTML

<span class="icon">
  <i class="fas fa-home"></i>
</span>

The yellow background is only here for demonstration purposes, to highlight the icon container's area.

By default, the icon container will take up exactly 1.5rem x 1.5rem. The icon itself is sized accordingly to the icon library you're using. For example, Font Awesome 5 icons will inherit the font size.
Icon text
#

You can combine an icon with text, using the icon-text wrapper, as long as all text inside is wrapped in its own span element:

Example
Home

HTML

<span class="icon-text">
  <span class="icon">
    <i class="fas fa-home"></i>
  </span>
  <span>Home</span>
</span>

You can combine as many icon elements and text elements as you want:

Example
Paris
Budapest
Bucharest
Istanbul

HTML

<span class="icon-text">
  <span class="icon">
    <i class="fas fa-train"></i>
  </span>
  <span>Paris</span>
  <span class="icon">
    <i class="fas fa-arrow-right"></i>
  </span>
  <span>Budapest</span>
  <span class="icon">
    <i class="fas fa-arrow-right"></i>
  </span>
  <span>Bucharest</span>
  <span class="icon">
    <i class="fas fa-arrow-right"></i>
  </span>
  <span>Istanbul</span>
  <span class="icon">
    <i class="fas fa-flag-checkered"></i>
  </span>
</span>

Since icon-text is an inline-flex element, it can easily be inserted within any paragraph of text.

Example

An invitation to
dinner was soon afterwards dispatched; and already had Mrs. Bennet planned the courses that were to do credit to her housekeeping, when an answer arrived which deferred it all. Mr. Bingley was obliged to be in
town the following day, and, consequently, unable to accept the honour of their
invitation , etc.

Mrs. Bennet was quite disconcerted. She could not imagine what business he could have in town so soon after his
arrival in Hertfordshire; and she began to fear that he might be always
flying about from one place to another, and never settled at Netherfield as he ought to be.

HTML

<div class="content">
  <p>
    An invitation to
    <span class="icon-text">
      <span class="icon">
        <i class="fas fa-utensils"></i>
      </span>
      <span>dinner</span>
    </span>
    was soon afterwards dispatched; and already had Mrs. Bennet planned the
    courses that were to do credit to her housekeeping, when an answer arrived
    which deferred it all. Mr. Bingley was obliged to be in
    <span class="icon-text">
      <span class="icon">
        <i class="fas fa-city"></i>
      </span>
      <span>town</span>
    </span>
    the following day, and, consequently, unable to accept the honour of their
    <span class="icon-text">
      <span class="icon">
        <i class="fas fa-envelope-open-text"></i>
      </span>
      <span>invitation</span> </span
    >, etc.
  </p>

  <p>
    Mrs. Bennet was quite disconcerted. She could not imagine what business he
    could have in town so soon after his
    <span class="icon-text">
      <span class="icon">
        <i class="fas fa-flag-checkered"></i>
      </span>
      <span>arrival</span>
    </span>
    in Hertfordshire; and she began to fear that he might be always
    <span class="icon-text">
      <span class="icon">
        <i class="fas fa-plane-departure"></i>
      </span>
      <span>flying</span>
    </span>
    about from one place to another, and never settled at Netherfield as he
    ought to be.
  </p>
</div>

You can also turn the icon-text into a flex element simply by using a <div> tag instead:

Example
Information

Your package will be delivered on Tuesday at 08:00.
Success

Your image has been successfully uploaded.
Warning

Some information is missing from your profile details.
Danger

There was an error in your submission. Please try again.

HTML

<div class="icon-text">
  <span class="icon has-text-info">
    <i class="fas fa-info-circle"></i>
  </span>
  <span>Information</span>
</div>

<p class="block">
  Your package will be delivered on <strong>Tuesday at 08:00</strong>.
</p>

<div class="icon-text">
  <span class="icon has-text-success">
    <i class="fas fa-check-square"></i>
  </span>
  <span>Success</span>
</div>

<p class="block">Your image has been successfully uploaded.</p>

<div class="icon-text">
  <span class="icon has-text-warning">
    <i class="fas fa-exclamation-triangle"></i>
  </span>
  <span>Warning</span>
</div>

<p class="block">
  Some information is missing from your <a href="#">profile</a> details.
</p>

<div class="icon-text">
  <span class="icon has-text-danger">
    <i class="fas fa-ban"></i>
  </span>
  <span>Danger</span>
</div>

<p class="block">
  There was an error in your submission. <a href="#">Please try again</a>.
</p>

Colors
#

Since icon fonts are simply text, you can use the color helpers to change the icon's color.

Example

HTML

<span class="icon has-text-info">
  <i class="fas fa-info-circle"></i>
</span>
<span class="icon has-text-success">
  <i class="fas fa-check-square"></i>
</span>
<span class="icon has-text-warning">
  <i class="fas fa-exclamation-triangle"></i>
</span>
<span class="icon has-text-danger">
  <i class="fas fa-ban"></i>
</span>

The same applies to the icon-text:

Example
Info
Success
Warning
Danger

HTML

<span class="icon-text has-text-info">
  <span class="icon">
    <i class="fas fa-info-circle"></i>
  </span>
  <span>Info</span>
</span>

<span class="icon-text has-text-success">
  <span class="icon">
    <i class="fas fa-check-square"></i>
  </span>
  <span>Success</span>
</span>

<span class="icon-text has-text-warning">
  <span class="icon">
    <i class="fas fa-exclamation-triangle"></i>
  </span>
  <span>Warning</span>
</span>

<span class="icon-text has-text-danger">
  <span class="icon">
    <i class="fas fa-ban"></i>
  </span>
  <span>Danger</span>
</span>

Sizes
#

The Bulma icon container comes in 4 sizes. It should always be slightly bigger than the icon it contains. For example, Font Awesome 5 icons use a font-size of 1em by default (since it inherits the font size), but provides additional sizes.
Container class 	Container size 	Font Awesome 5 class 	Icon size 	Result
icon is-small 	1rem x 1rem 	fas 	1em 	
icon 	1.5rem x 1.5rem 	fas 	1em 	
fas fa-lg 	1.33em 	
icon is-medium 	2rem x 2rem 	fas 	1em 	
fas fa-lg 	1.33em 	
fas fa-2x 	2em 	
icon is-large 	3rem x 3rem 	fas 	1em 	
fas fa-lg 	1.33em 	
fas fa-2x 	2em 	
Font Awesome variations
#

Font Awesome also provides modifier classes for:

    fixed width icons
    bordered icons
    animated icons
    stacked icons

Type 	Font Awesome class 	Result
Fixed width 	fas fa-fw 	
Bordered 	fas fa-border 	
Animated 	fas fa-spinner fa-pulse 	
Stacked 	

<span class="icon is-medium">
  <span class="fa-stack fa-sm">
    <i class="fas fa-circle fa-stack-2x"></i>
    <i class="fas fa-flag fa-stack-1x fa-inverse"></i>
  </span>
</span>

<span class="icon is-large">
  <span class="fa-stack fa-lg">
    <i class="fas fa-camera fa-stack-1x"></i>
    <i class="fas fa-ban fa-stack-2x has-text-danger"></i>
  </span>
</span>

Material Design Icons
#

Here is how the icon container can be used with Material Design Icons.
Container class 	Container size 	MDI class 	Icon size 	Result
icon is-small 	1rem x 1rem 	mdi 	1em 	
icon 	1.5rem x 1.5rem 	mdi mdi-18px 	18px 	
mdi mdi-24px 	24px 	
icon is-medium 	2rem x 2rem 	mdi 	1em 	
mdi mdi-18px 	18px 	
mdi mdi-24px 	24px 	
mdi mdi-36px 	36px 	
icon is-large 	3rem x 3rem 	mdi 	1em 	
mdi mdi-18px 	18px 	
mdi mdi-24px 	24px 	
mdi mdi-36px 	36px 	
mdi mdi-48px 	48px 	

MDI also provides modifier classes for:

    light and dark icons
    rotated & flipped icons

Type 	Material Design Icon class 	Result
Light color 	mdi mdi-light 	
Dark color 	mdi mdi-dark 	
Light inactive color 	mdi mdi-light mdi-inactive 	
Dark inactive color 	mdi mdi-dark mdi-inactive 	
Flipped 	mdi mdi-flip-h
mdi mdi-flip-v 	

Rotated 	mdi mdi-rotate-45
mdi mdi-rotate-90
mdi mdi-rotate-180 	


Ionicons
#

Here is how the icon container can be used with Ionicons.
Container class 	Container size 	Ionicon class 	Icon size 	Result
icon is-small 	1rem x 1rem 	ion-ionic 	1em 	
icon 	1.5rem x 1.5rem 	ion-ionic 	1em 	
icon is-medium 	2rem x 2rem 	ion-ionic 	1em 	
icon is-large 	3rem x 3rem 	ion-ionic 	1em 	
Sass and CSS variables
#
Sass Variable
	
CSS Variable
	
Value

$icon-dimensions

var(--bulma-icon-dimensions)

1.5rem

$icon-dimensions-small

var(--bulma-icon-dimensions-small)

1rem

$icon-dimensions-medium

var(--bulma-icon-dimensions-medium)

2rem

$icon-dimensions-large

var(--bulma-icon-dimensions-large)

3rem

$icon-text-spacing

var(--bulma-icon-text-spacing)

0.25em



Delete

A versatile delete cross
CSS Masterclass

The delete element is a stand-alone element that can be used in different contexts.

On its own, it's a simple circle with a cross:

Example

HTML

<button class="delete"></button>

Sizes
#

It comes in 4 sizes:

Example

HTML

<button class="delete is-small"></button>
<button class="delete"></button>
<button class="delete is-medium"></button>
<button class="delete is-large"></button>

Combinations
#

Bulma uses it for the tags, the notifications, and the messages:

Example
Hello World
Lorem ipsum dolor sit amet, consectetur adipiscing elit lorem ipsum dolor sit amet, consectetur adipiscing elit
Info
Lorem ipsum dolor sit amet, consectetur adipiscing elit. Pellentesque risus mi, tempus quis placerat ut, porta nec nulla. Vestibulum rhoncus ac ex sit amet fringilla. Nullam gravida purus diam, et dictum felis venenatis efficitur. Aenean ac eleifend lacus, in mollis lectus. Donec sodales, arcu et sollicitudin porttitor, tortor urna tempor ligula, id porttitor mi magna a neque. Donec dui urna, vehicula et sem eget, facilisis sodales sem.

HTML

<div class="block">
  <span class="tag is-success">
    Hello World
    <button class="delete is-small"></button>
  </span>
</div>

<div class="notification is-danger">
  <button class="delete"></button>
  Lorem ipsum dolor sit amet, consectetur adipiscing elit lorem ipsum dolor sit
  amet, consectetur adipiscing elit
</div>

<article class="message is-info">
  <div class="message-header">
    Info
    <button class="delete"></button>
  </div>
  <div class="message-body">
    Lorem ipsum dolor sit amet, consectetur adipiscing elit. Pellentesque risus
    mi, tempus quis placerat ut, porta nec nulla. Vestibulum rhoncus ac ex sit
    amet fringilla. Nullam gravida purus diam, et dictum felis venenatis
    efficitur. Aenean ac eleifend lacus, in mollis lectus. Donec sodales, arcu
    et sollicitudin porttitor, tortor urna tempor ligula, id porttitor mi magna
    a neque. Donec dui urna, vehicula et sem eget, facilisis sodales sem.
  </div>
</article>

Sass and CSS variables
#
CSS Variable
	
Value

var(--bulma-delete-dimensions)

1.25rem

var(--bulma-delete-background-l)

0%

var(--bulma-delete-background-alpha)

0.5

var(--bulma-delete-color)

var(--bulma-white)



Content

A single class to handle WYSIWYG generated content, where only HTML tags are available
CSS Masterclass

When you can't use the CSS classes you want, or when you just want to directly use HTML tags, use content as container. It can handle almost any HTML tag:

    <p> paragraphs
    <ul> <ol> <dl> lists
    <h1> to <h6> headings
    <blockquote> quotes
    <em> and <strong>
    <table> <tr> <th> <td> tables

This content class can be used in any context where you just want to (or can only) write some text. For example, it's used for the paragraph you're currently reading.
Full example
#
Here is an example of the content Bulma element with all the supported HTML tags:

Example
Hello World

Lorem ipsum[1] dolor sit amet, consectetur adipiscing elit. Nulla accumsan, metus ultrices eleifend gravida, nulla nunc varius lectus, nec rutrum justo nibh eu lectus. Ut vulputate semper dui. Fusce erat odio, sollicitudin vel erat vel, interdum mattis neque. Subscript works as well!
Second level

Curabitur accumsan turpis pharetra augue tincidunt blandit. Quisque condimentum maximus mi, sit amet commodo arcu rutrum id. Proin pretium urna vel cursus venenatis. Suspendisse potenti. Etiam mattis sem rhoncus lacus dapibus facilisis. Donec at dignissim dui. Ut et neque nisl.

    In fermentum leo eu lectus mollis, quis dictum mi aliquet.
    Morbi eu nulla lobortis, lobortis est in, fringilla felis.
    Aliquam nec felis in sapien venenatis viverra fermentum nec lectus.
    Ut non enim metus.

Third level

Quisque ante lacus, malesuada ac auctor vitae, congue non ante. Phasellus lacus ex, semper ac tortor nec, fringilla condimentum orci. Fusce eu rutrum tellus.

    Donec blandit a lorem id convallis.
    Cras gravida arcu at diam gravida gravida.
    Integer in volutpat libero.
    Donec a diam tellus.
    Aenean nec tortor orci.
    Quisque aliquam cursus urna, non bibendum massa viverra eget.
    Vivamus maximus ultricies pulvinar.

    Ut venenatis, nisl scelerisque sollicitudin fermentum, quam libero hendrerit ipsum, ut blandit est tellus sit amet turpis. 

Quisque at semper enim, eu hendrerit odio. Etiam auctor nisl et justo sodales elementum. Maecenas ultrices lacus quis neque consectetur, et lobortis nisi molestie.

Sed sagittis enim ac tortor maximus rutrum. Nulla facilisi. Donec mattis vulputate risus in luctus. Maecenas vestibulum interdum commodo.

Web
    The part of the Internet that contains websites and web pages
HTML
    A markup language for creating web pages
CSS
    A technology to make HTML look better

Suspendisse egestas sapien non felis placerat elementum. Morbi tortor nisl, suscipit sed mi sit amet, mollis malesuada nulla. Nulla facilisi. Nullam ac erat ante.
Fourth level

Nulla efficitur eleifend nisi, sit amet bibendum sapien fringilla ac. Mauris euismod metus a tellus laoreet, at elementum ex efficitur.

 <!DOCTYPE html> <html> <head>
<title>Hello World</title> </head> <body> <p>Lorem
ipsum dolor sit amet, consectetur adipiscing elit. Donec viverra nec nulla vitae
mollis.</p> </body> </html> 

Maecenas eleifend sollicitudin dui, faucibus sollicitudin augue cursus non. Ut finibus eleifend arcu ut vehicula. Mauris eu est maximus est porta condimentum in eu justo. Nulla id iaculis sapien.
One 	Two
Three 	Four
Five 	Six
Seven 	Eight
Nine 	Ten
Eleven 	Twelve

Phasellus porttitor enim id metus volutpat ultricies. Ut nisi nunc, blandit sed dapibus at, vestibulum in felis. Etiam iaculis lorem ac nibh bibendum rhoncus. Nam interdum efficitur ligula sit amet ullamcorper. Etiam tristique, leo vitae porta faucibus, mi lacus laoreet metus, at cursus leo est vel tellus. Sed ac posuere est. Nunc ultricies nunc neque, vitae ultricies ex sodales quis. Aliquam eu nibh in libero accumsan pulvinar. Nullam nec nisl placerat, pretium metus vel, euismod ipsum. Proin tempor cursus nisl vel condimentum. Nam pharetra varius metus non pellentesque.
Fifth level

Aliquam sagittis rhoncus vulputate. Cras non luctus sem, sed tincidunt ligula. Vestibulum at nunc elit. Praesent aliquet ligula mi, in luctus elit volutpat porta. Phasellus molestie diam vel nisi sodales, a eleifend augue laoreet. Sed nec eleifend justo. Nam et sollicitudin odio.
Figure 1: Some beautiful placeholders
Sixth level

Cras in nibh lacinia, venenatis nisi et, auctor urna. Donec pulvinar lacus sed diam dignissim, ut eleifend eros accumsan. Phasellus non tortor eros. Ut sed rutrum lacus. Etiam purus nunc, scelerisque quis enim vitae, malesuada ultrices turpis. Nunc vitae maximus purus, nec consectetur dui. Suspendisse euismod, elit vel rutrum commodo, ipsum tortor maximus dui, sed varius sapien odio vitae est. Etiam at cursus metus.

HTML

<div class="content">
  <h1>Hello World</h1>
  <p>
    Lorem ipsum<sup><a>[1]</a></sup> dolor sit amet, consectetur adipiscing
    elit. Nulla accumsan, metus ultrices eleifend gravida, nulla nunc varius
    lectus, nec rutrum justo nibh eu lectus. Ut vulputate semper dui. Fusce erat
    odio, sollicitudin vel erat vel, interdum mattis neque. Sub<sub>script</sub>
    works as well!
  </p>
  <h2>Second level</h2>
  <p>
    Curabitur accumsan turpis pharetra <strong>augue tincidunt</strong> blandit.
    Quisque condimentum maximus mi, sit amet commodo arcu rutrum id. Proin
    pretium urna vel cursus venenatis. Suspendisse potenti. Etiam mattis sem
    rhoncus lacus dapibus facilisis. Donec at dignissim dui. Ut et neque nisl.
  </p>
  <ul>
    <li>In fermentum leo eu lectus mollis, quis dictum mi aliquet.</li>
    <li>Morbi eu nulla lobortis, lobortis est in, fringilla felis.</li>
    <li>Aliquam nec felis in sapien venenatis viverra fermentum nec lectus.</li>
    <li>Ut non enim metus.</li>
  </ul>
  <h3>Third level</h3>
  <p>
    Quisque ante lacus, malesuada ac auctor vitae, congue
    <a href="#">non ante</a>. Phasellus lacus ex, semper ac tortor nec,
    fringilla condimentum orci. Fusce eu rutrum tellus.
  </p>
  <ol>
    <li>Donec blandit a lorem id convallis.</li>
    <li>Cras gravida arcu at diam gravida gravida.</li>
    <li>Integer in volutpat libero.</li>
    <li>Donec a diam tellus.</li>
    <li>Aenean nec tortor orci.</li>
    <li>Quisque aliquam cursus urna, non bibendum massa viverra eget.</li>
    <li>Vivamus maximus ultricies pulvinar.</li>
  </ol>
  <blockquote>
    Ut venenatis, nisl scelerisque sollicitudin fermentum, quam libero hendrerit
    ipsum, ut blandit est tellus sit amet turpis.
  </blockquote>
  <p>
    Quisque at semper enim, eu hendrerit odio. Etiam auctor nisl et
    <em>justo sodales</em> elementum. Maecenas ultrices lacus quis neque
    consectetur, et lobortis nisi molestie.
  </p>
  <p>
    Sed sagittis enim ac tortor maximus rutrum. Nulla facilisi. Donec mattis
    vulputate risus in luctus. Maecenas vestibulum interdum commodo.
  </p>
  <dl>
    <dt>Web</dt>
    <dd>The part of the Internet that contains websites and web pages</dd>
    <dt>HTML</dt>
    <dd>A markup language for creating web pages</dd>
    <dt>CSS</dt>
    <dd>A technology to make HTML look better</dd>
  </dl>
  <p>
    Suspendisse egestas sapien non felis placerat elementum. Morbi tortor nisl,
    suscipit sed mi sit amet, mollis malesuada nulla. Nulla facilisi. Nullam ac
    erat ante.
  </p>
  <h4>Fourth level</h4>
  <p>
    Nulla efficitur eleifend nisi, sit amet bibendum sapien fringilla ac. Mauris
    euismod metus a tellus laoreet, at elementum ex efficitur.
  </p>
  <pre> &lt;!DOCTYPE html&gt; &lt;html&gt; &lt;head&gt;
&lt;title&gt;Hello World&lt;/title&gt; &lt;/head&gt; &lt;body&gt; &lt;p&gt;Lorem
ipsum dolor sit amet, consectetur adipiscing elit. Donec viverra nec nulla vitae
mollis.&lt;/p&gt; &lt;/body&gt; &lt;/html&gt; </pre>
  <p>
    Maecenas eleifend sollicitudin dui, faucibus sollicitudin augue cursus non.
    Ut finibus eleifend arcu ut vehicula. Mauris eu est maximus est porta
    condimentum in eu justo. Nulla id iaculis sapien.
  </p>
  <table>
    <thead>
      <tr>
        <th>One</th>
        <th>Two</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>Three</td>
        <td>Four</td>
      </tr>
      <tr>
        <td>Five</td>
        <td>Six</td>
      </tr>
      <tr>
        <td>Seven</td>
        <td>Eight</td>
      </tr>
      <tr>
        <td>Nine</td>
        <td>Ten</td>
      </tr>
      <tr>
        <td>Eleven</td>
        <td>Twelve</td>
      </tr>
    </tbody>
  </table>
  <p>
    Phasellus porttitor enim id metus volutpat ultricies. Ut nisi nunc, blandit
    sed dapibus at, vestibulum in felis. Etiam iaculis lorem ac nibh bibendum
    rhoncus. Nam interdum efficitur ligula sit amet ullamcorper. Etiam
    tristique, leo vitae porta faucibus, mi lacus laoreet metus, at cursus leo
    est vel tellus. Sed ac posuere est. Nunc ultricies nunc neque, vitae
    ultricies ex sodales quis. Aliquam eu nibh in libero accumsan pulvinar.
    Nullam nec nisl placerat, pretium metus vel, euismod ipsum. Proin tempor
    cursus nisl vel condimentum. Nam pharetra varius metus non pellentesque.
  </p>
  <h5>Fifth level</h5>
  <p>
    Aliquam sagittis rhoncus vulputate. Cras non luctus sem, sed tincidunt
    ligula. Vestibulum at nunc elit. Praesent aliquet ligula mi, in luctus elit
    volutpat porta. Phasellus molestie diam vel nisi sodales, a eleifend augue
    laoreet. Sed nec eleifend justo. Nam et sollicitudin odio.
  </p>
  <figure>
    <img src="https://bulma.io/assets/images/placeholders/256x256.png" />
    <img src="https://bulma.io/assets/images/placeholders/256x256.png" />
    <figcaption>Figure 1: Some beautiful placeholders</figcaption>
  </figure>
  <h6>Sixth level</h6>
  <p>
    Cras in nibh lacinia, venenatis nisi et, auctor urna. Donec pulvinar lacus
    sed diam dignissim, ut eleifend eros accumsan. Phasellus non tortor eros. Ut
    sed rutrum lacus. Etiam purus nunc, scelerisque quis enim vitae, malesuada
    ultrices turpis. Nunc vitae maximus purus, nec consectetur dui. Suspendisse
    euismod, elit vel rutrum commodo, ipsum tortor maximus dui, sed varius
    sapien odio vitae est. Etiam at cursus metus.
  </p>
</div>

Ordered lists alternatives
#

Ordered lists <ol> support different types of items markers. To modify them, use either:

    the corresponding HTML attribute value
    one of the following CSS modifier classes: is-lower-alpha, is-lower-roman, is-upper-alpha or is-upper-roman

Example

    Coffee
    Tea
    Milk

    Coffee
    Tea
    Milk

    Coffee
    Tea
    Milk

    Coffee
    Tea
    Milk

    Coffee
    Tea
    Milk

HTML

<div class="content">
  <ol type="1">
    <li>Coffee</li>
    <li>Tea</li>
    <li>Milk</li>
  </ol>
  <ol type="A">
    <li>Coffee</li>
    <li>Tea</li>
    <li>Milk</li>
  </ol>
  <ol type="a">
    <li>Coffee</li>
    <li>Tea</li>
    <li>Milk</li>
  </ol>
  <ol type="I">
    <li>Coffee</li>
    <li>Tea</li>
    <li>Milk</li>
  </ol>
  <ol type="i">
    <li>Coffee</li>
    <li>Tea</li>
    <li>Milk</li>
  </ol>
</div>

Example

    Coffee
    Tea
    Milk

    Coffee
    Tea
    Milk

    Coffee
    Tea
    Milk

    Coffee
    Tea
    Milk

HTML

<div class="content">
  <ol class="is-lower-alpha">
    <li>Coffee</li>
    <li>Tea</li>
    <li>Milk</li>
  </ol>
  <ol class="is-lower-roman">
    <li>Coffee</li>
    <li>Tea</li>
    <li>Milk</li>
  </ol>
  <ol class="is-upper-alpha">
    <li>Coffee</li>
    <li>Tea</li>
    <li>Milk</li>
  </ol>
  <ol class="is-upper-roman">
    <li>Coffee</li>
    <li>Tea</li>
    <li>Milk</li>
  </ol>
</div>

Sizes
#

You can use the is-small, is-medium and is-large modifiers to change the font size.
Small size content

Example
Hello World

Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nulla accumsan, metus ultrices eleifend gravida, nulla nunc varius lectus, nec rutrum justo nibh eu lectus. Ut vulputate semper dui. Fusce erat odio, sollicitudin vel erat vel, interdum mattis neque.
Second level

Curabitur accumsan turpis pharetra augue tincidunt blandit. Quisque condimentum maximus mi, sit amet commodo arcu rutrum id. Proin pretium urna vel cursus venenatis. Suspendisse potenti. Etiam mattis sem rhoncus lacus dapibus facilisis. Donec at dignissim dui. Ut et neque nisl.

    In fermentum leo eu lectus mollis, quis dictum mi aliquet.
    Morbi eu nulla lobortis, lobortis est in, fringilla felis.
    Aliquam nec felis in sapien venenatis viverra fermentum nec lectus.
    Ut non enim metus.

HTML

<div class="content is-small">
  <h1>Hello World</h1>
  <p>
    Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nulla accumsan,
    metus ultrices eleifend gravida, nulla nunc varius lectus, nec rutrum justo
    nibh eu lectus. Ut vulputate semper dui. Fusce erat odio, sollicitudin vel
    erat vel, interdum mattis neque.
  </p>
  <h2>Second level</h2>
  <p>
    Curabitur accumsan turpis pharetra <strong>augue tincidunt</strong> blandit.
    Quisque condimentum maximus mi, sit amet commodo arcu rutrum id. Proin
    pretium urna vel cursus venenatis. Suspendisse potenti. Etiam mattis sem
    rhoncus lacus dapibus facilisis. Donec at dignissim dui. Ut et neque nisl.
  </p>
  <ul>
    <li>In fermentum leo eu lectus mollis, quis dictum mi aliquet.</li>
    <li>Morbi eu nulla lobortis, lobortis est in, fringilla felis.</li>
    <li>Aliquam nec felis in sapien venenatis viverra fermentum nec lectus.</li>
    <li>Ut non enim metus.</li>
  </ul>
</div>

Normal size content (default)

Example
Hello World

Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nulla accumsan, metus ultrices eleifend gravida, nulla nunc varius lectus, nec rutrum justo nibh eu lectus. Ut vulputate semper dui. Fusce erat odio, sollicitudin vel erat vel, interdum mattis neque.
Second level

Curabitur accumsan turpis pharetra augue tincidunt blandit. Quisque condimentum maximus mi, sit amet commodo arcu rutrum id. Proin pretium urna vel cursus venenatis. Suspendisse potenti. Etiam mattis sem rhoncus lacus dapibus facilisis. Donec at dignissim dui. Ut et neque nisl.

    In fermentum leo eu lectus mollis, quis dictum mi aliquet.
    Morbi eu nulla lobortis, lobortis est in, fringilla felis.
    Aliquam nec felis in sapien venenatis viverra fermentum nec lectus.
    Ut non enim metus.

HTML

<div class="content is-normal">
  <h1>Hello World</h1>
  <p>
    Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nulla accumsan,
    metus ultrices eleifend gravida, nulla nunc varius lectus, nec rutrum justo
    nibh eu lectus. Ut vulputate semper dui. Fusce erat odio, sollicitudin vel
    erat vel, interdum mattis neque.
  </p>
  <h2>Second level</h2>
  <p>
    Curabitur accumsan turpis pharetra <strong>augue tincidunt</strong> blandit.
    Quisque condimentum maximus mi, sit amet commodo arcu rutrum id. Proin
    pretium urna vel cursus venenatis. Suspendisse potenti. Etiam mattis sem
    rhoncus lacus dapibus facilisis. Donec at dignissim dui. Ut et neque nisl.
  </p>
  <ul>
    <li>In fermentum leo eu lectus mollis, quis dictum mi aliquet.</li>
    <li>Morbi eu nulla lobortis, lobortis est in, fringilla felis.</li>
    <li>Aliquam nec felis in sapien venenatis viverra fermentum nec lectus.</li>
    <li>Ut non enim metus.</li>
  </ul>
</div>

Medium size content

Example
Hello World

Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nulla accumsan, metus ultrices eleifend gravida, nulla nunc varius lectus, nec rutrum justo nibh eu lectus. Ut vulputate semper dui. Fusce erat odio, sollicitudin vel erat vel, interdum mattis neque.
Second level

Curabitur accumsan turpis pharetra augue tincidunt blandit. Quisque condimentum maximus mi, sit amet commodo arcu rutrum id. Proin pretium urna vel cursus venenatis. Suspendisse potenti. Etiam mattis sem rhoncus lacus dapibus facilisis. Donec at dignissim dui. Ut et neque nisl.

    In fermentum leo eu lectus mollis, quis dictum mi aliquet.
    Morbi eu nulla lobortis, lobortis est in, fringilla felis.
    Aliquam nec felis in sapien venenatis viverra fermentum nec lectus.
    Ut non enim metus.

HTML

<div class="content is-medium">
  <h1>Hello World</h1>
  <p>
    Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nulla accumsan,
    metus ultrices eleifend gravida, nulla nunc varius lectus, nec rutrum justo
    nibh eu lectus. Ut vulputate semper dui. Fusce erat odio, sollicitudin vel
    erat vel, interdum mattis neque.
  </p>
  <h2>Second level</h2>
  <p>
    Curabitur accumsan turpis pharetra <strong>augue tincidunt</strong> blandit.
    Quisque condimentum maximus mi, sit amet commodo arcu rutrum id. Proin
    pretium urna vel cursus venenatis. Suspendisse potenti. Etiam mattis sem
    rhoncus lacus dapibus facilisis. Donec at dignissim dui. Ut et neque nisl.
  </p>
  <ul>
    <li>In fermentum leo eu lectus mollis, quis dictum mi aliquet.</li>
    <li>Morbi eu nulla lobortis, lobortis est in, fringilla felis.</li>
    <li>Aliquam nec felis in sapien venenatis viverra fermentum nec lectus.</li>
    <li>Ut non enim metus.</li>
  </ul>
</div>

Large size content

Example
Hello World

Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nulla accumsan, metus ultrices eleifend gravida, nulla nunc varius lectus, nec rutrum justo nibh eu lectus. Ut vulputate semper dui. Fusce erat odio, sollicitudin vel erat vel, interdum mattis neque.
Second level

Curabitur accumsan turpis pharetra augue tincidunt blandit. Quisque condimentum maximus mi, sit amet commodo arcu rutrum id. Proin pretium urna vel cursus venenatis. Suspendisse potenti. Etiam mattis sem rhoncus lacus dapibus facilisis. Donec at dignissim dui. Ut et neque nisl.

    In fermentum leo eu lectus mollis, quis dictum mi aliquet.
    Morbi eu nulla lobortis, lobortis est in, fringilla felis.
    Aliquam nec felis in sapien venenatis viverra fermentum nec lectus.
    Ut non enim metus.

HTML

<div class="content is-large">
  <h1>Hello World</h1>
  <p>
    Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nulla accumsan,
    metus ultrices eleifend gravida, nulla nunc varius lectus, nec rutrum justo
    nibh eu lectus. Ut vulputate semper dui. Fusce erat odio, sollicitudin vel
    erat vel, interdum mattis neque.
  </p>
  <h2>Second level</h2>
  <p>
    Curabitur accumsan turpis pharetra <strong>augue tincidunt</strong> blandit.
    Quisque condimentum maximus mi, sit amet commodo arcu rutrum id. Proin
    pretium urna vel cursus venenatis. Suspendisse potenti. Etiam mattis sem
    rhoncus lacus dapibus facilisis. Donec at dignissim dui. Ut et neque nisl.
  </p>
  <ul>
    <li>In fermentum leo eu lectus mollis, quis dictum mi aliquet.</li>
    <li>Morbi eu nulla lobortis, lobortis est in, fringilla felis.</li>
    <li>Aliquam nec felis in sapien venenatis viverra fermentum nec lectus.</li>
    <li>Ut non enim metus.</li>
  </ul>
</div>

Sass and CSS variables
#
Sass Variable
	
CSS Variable
	
Value

$content-heading-color

var(--bulma-content-heading-color)

var(--bulma-text-strong)

$content-heading-weight

var(--bulma-content-heading-weight)

var(--bulma-weight-extrabold)

$content-heading-line-height

var(--bulma-content-heading-line-height)

1.125

$content-block-margin-bottom

var(--bulma-content-block-margin-bottom)

1em

$content-blockquote-background-color

var(--bulma-content-blockquote-background-color)

var(--bulma-background)

$content-blockquote-border-left

var(--bulma-content-blockquote-border-left)

5px solid var(--bulma-border)

$content-blockquote-padding

var(--bulma-content-blockquote-padding)

1.25em 1.5em

$content-pre-padding

var(--bulma-content-pre-padding)

1.25em 1.5em

$content-table-cell-border

var(--bulma-content-table-cell-border)

1px solid var(--bulma-border)

$content-table-cell-border-width

var(--bulma-content-table-cell-border-width)

0 0 1px

$content-table-cell-padding

var(--bulma-content-table-cell-padding)

0.5em 0.75em

$content-table-cell-heading-color

var(--bulma-content-table-cell-heading-color)

var(--bulma-text-strong)

$content-table-head-cell-border-width

var(--bulma-content-table-head-cell-border-width)

0 0 2px

$content-table-head-cell-color

var(--bulma-content-table-head-cell-color)

var(--bulma-text-strong)

$content-table-body-last-row-cell-border-bottom-width

var(--bulma-content-table-body-last-row-cell-border-bottom-width)

0

$content-table-foot-cell-border-width

var(--bulma-content-table-foot-cell-border-width)

2px 0 0

$content-table-foot-cell-color

var(--bulma-content-table-foot-cell-color)

var(--bulma-text-strong)



Button

The classic button, in different colors, sizes, and states
CSS Masterclass

The button is an essential element of any design. It's meant to look and behave as an interactive element of your page.

Example

HTML

<button class="button">Button</button>

The button class can be used on:

    <a> anchor links
    <button> form buttons
    <input type="submit"> submit inputs
    <input type="reset"> reset inputs

Example

HTML

<a class="button">Anchor</a>
<button class="button">Button</button>
<input class="button" type="submit" value="Submit input" />
<input class="button" type="reset" value="Reset input" />

Colors
#

The button is available in all the different colors defined by the $colors Sass map.

Example

HTML

<button class="button is-white">White</button>
<button class="button is-light">Light</button>
<button class="button is-dark">Dark</button>
<button class="button is-black">Black</button>
<button class="button is-text">Text</button>
<button class="button is-ghost">Ghost</button>

Example

HTML

<div class="buttons">
  <button class="button is-primary">Primary</button>
  <button class="button is-link">Link</button>
</div>

<div class="buttons">
  <button class="button is-info">Info</button>
  <button class="button is-success">Success</button>
  <button class="button is-warning">Warning</button>
  <button class="button is-danger">Danger</button>
</div>

Each color also comes in its light version. Simply append the modifier is-light to the color modifier to apply the light version of the button.

Example

HTML

<div class="buttons">
  <button class="button is-primary is-light">Primary</button>
  <button class="button is-link is-light">Link</button>
</div>

<div class="buttons">
  <button class="button is-info is-light">Info</button>
  <button class="button is-success is-light">Success</button>
  <button class="button is-warning is-light">Warning</button>
  <button class="button is-danger is-light">Danger</button>
</div>

A dark version also exists. Simply append the modifier is-dark.

Example

HTML

<div class="buttons">
  <button class="button is-primary is-dark">Primary</button>
  <button class="button is-link is-dark">Link</button>
</div>

<div class="buttons">
  <button class="button is-info is-dark">Info</button>
  <button class="button is-success is-dark">Success</button>
  <button class="button is-warning is-dark">Warning</button>
  <button class="button is-danger is-dark">Danger</button>
</div>

Sizes
#

The button comes in 4 different sizes:

    small
    normal
    medium
    large

While the default size is the normal one, the is-normal modifier exists in case you need to reset the button to its normal size.

Example

HTML

<button class="button is-small">Small</button>
<button class="button">Default</button>
<button class="button is-normal">Normal</button>
<button class="button is-medium">Medium</button>
<button class="button is-large">Large</button>

You can change the size of multiple buttons at once by wrapping them in a buttons parent, and applying one of 3 modifiers:

    buttons are-small
    buttons are-medium
    buttons are-large

Example

HTML

<div class="buttons are-medium">
  <button class="button">All</button>
  <button class="button">Medium</button>
  <button class="button">Size</button>
</div>

You can change the size of only a subset of buttons by simply applying a modifier class to them.
For example, if you want all buttons to be small but still have one in its normal size, simply do the following:

Example

HTML

<div class="buttons are-small">
  <button class="button">Small</button>
  <button class="button">Small</button>
  <button class="button">Small</button>
  <button class="button is-normal">Normal</button>
  <button class="button">Small</button>
</div>

Responsive sizes
#

If you want different button sizes for each breakpoint, you can use Bulma's responsive buttons. Simply append the is-responsive modifier:
Name 	Fixed size 	Responsive size (resize window to see in action) 	Code
Default 	

<button class="button is-responsive">
  Default
</button>

Small 	

<button class="button is-small is-responsive">
  Small
</button>

Normal 	

<button class="button is-normal is-responsive">
  Normal
</button>

Medium 	

<button class="button is-medium is-responsive">
  Medium
</button>

Large 	

<button class="button is-large is-responsive">
  Large
</button>

You can customise the sizes by overwriting the $button-responsive-sizes Sass variable.
Displays
#

Example

HTML

<button class="button is-small is-fullwidth">Small</button>
<button class="button is-fullwidth">Normal</button>
<button class="button is-medium is-fullwidth">Medium</button>
<button class="button is-large is-fullwidth">Large</button>

Styles
#
Outlined

Example

HTML

<button class="button is-link is-outlined">Outlined</button>
<button class="button is-primary is-outlined">Outlined</button>
<button class="button is-info is-outlined">Outlined</button>
<button class="button is-success is-outlined">Outlined</button>
<button class="button is-danger is-outlined">Outlined</button>

Inverted (the text color becomes the background color, and vice-versa)

<button class="button is-link is-inverted">Inverted</button>
<button class="button is-primary is-inverted">Inverted</button>
<button class="button is-info is-inverted">Inverted</button>
<button class="button is-success is-inverted">Inverted</button>
<button class="button is-danger is-inverted">Inverted</button>

Rounded buttons

<button class="button is-rounded">Rounded</button>
<button class="button is-link is-rounded">Rounded</button>
<button class="button is-primary is-rounded">Rounded</button>
<button class="button is-info is-rounded">Rounded</button>
<button class="button is-success is-rounded">Rounded</button>
<button class="button is-danger is-rounded">Rounded</button>

States
#

Bulma styles the different states of its buttons. Each state is available as a pseudo-class and a CSS class:

    :hover and is-hovered
    :focus and is-focused
    :active and is-active

This allows you to obtain the style of a certain state without having to trigger it.
Normal

Example

HTML

<button class="button">Normal</button>
<button class="button is-link">Normal</button>
<button class="button is-primary">Normal</button>
<button class="button is-info">Normal</button>
<button class="button is-success">Normal</button>
<button class="button is-warning">Normal</button>
<button class="button is-danger">Normal</button>

Hover

Example

HTML

<button class="button is-hovered">Hover</button>
<button class="button is-link is-hovered">Hover</button>
<button class="button is-primary is-hovered">Hover</button>
<button class="button is-info is-hovered">Hover</button>
<button class="button is-success is-hovered">Hover</button>
<button class="button is-warning is-hovered">Hover</button>
<button class="button is-danger is-hovered">Hover</button>

Focus

Example

HTML

<button class="button is-focused">Focus</button>
<button class="button is-link is-focused">Focus</button>
<button class="button is-primary is-focused">Focus</button>
<button class="button is-info is-focused">Focus</button>
<button class="button is-success is-focused">Focus</button>
<button class="button is-warning is-focused">Focus</button>
<button class="button is-danger is-focused">Focus</button>

Active

Example

HTML

<button class="button is-active">Active</button>
<button class="button is-link is-active">Active</button>
<button class="button is-primary is-active">Active</button>
<button class="button is-info is-active">Active</button>
<button class="button is-success is-active">Active</button>
<button class="button is-warning is-active">Active</button>
<button class="button is-danger is-active">Active</button>

Loading

You can very easily turn a button into its loading version by appending the is-loading modifier. You don't even need to remove the inner text, which allows the button to maintain its original size between its default and loading states.

Since the loading spinner is implemented using the ::after pseudo-element, it is not supported by the <input type="submit"> element. Consider using <button type="submit"> instead.

<button class="button is-loading">Loading</button>
<button class="button is-link is-loading">Loading</button>
<button class="button is-primary is-loading">Loading</button>
<button class="button is-info is-loading">Loading</button>
<button class="button is-success is-loading">Loading</button>
<button class="button is-warning is-loading">Loading</button>
<button class="button is-danger is-loading">Loading</button>

Static

You can create a non-interactive button by using the is-static modifier. This is useful to align a text label with an input, for example when using form addons.

<span class="button is-static">Static</span>

Disabled

Bulma supports the use of the disabled Boolean HTML attribute, which prevents the user from interacting with the button.

The is-disabled CSS class has been deprecated in favor of the disabled HTML attribute. Learn more

<button class="button" title="Disabled button" disabled>Disabled</button>
<button class="button is-link" title="Disabled button" disabled>
  Disabled
</button>
<button class="button is-primary" title="Disabled button" disabled>
  Disabled
</button>
<button class="button is-info" title="Disabled button" disabled>
  Disabled
</button>
<button class="button is-success" title="Disabled button" disabled>
  Disabled
</button>
<button class="button is-warning" title="Disabled button" disabled>
  Disabled
</button>
<button class="button is-danger" title="Disabled button" disabled>
  Disabled
</button>

With Font Awesome icons

Bulma buttons can easily be enhanced by adding a Font Awesome icon. For the best results, wrap the inner text in a separate <span> element.

Example

HTML

<p class="buttons">
  <button class="button">
    <span class="icon is-small">
      <i class="fas fa-bold"></i>
    </span>
  </button>
  <button class="button">
    <span class="icon is-small">
      <i class="fas fa-italic"></i>
    </span>
  </button>
  <button class="button">
    <span class="icon is-small">
      <i class="fas fa-underline"></i>
    </span>
  </button>
</p>
<p class="buttons">
  <button class="button">
    <span class="icon">
      <i class="fab fa-github"></i>
    </span>
    <span>GitHub</span>
  </button>
  <button class="button is-primary">
    <span class="icon">
      <i class="fab fa-twitter"></i>
    </span>
    <span>@jgthms</span>
  </button>
  <button class="button is-success">
    <span class="icon is-small">
      <i class="fas fa-check"></i>
    </span>
    <span>Save</span>
  </button>
  <button class="button is-danger is-outlined">
    <span>Delete</span>
    <span class="icon is-small">
      <i class="fas fa-times"></i>
    </span>
  </button>
</p>
<p class="buttons">
  <button class="button is-small">
    <span class="icon is-small">
      <i class="fab fa-github"></i>
    </span>
    <span>GitHub</span>
  </button>
  <button class="button">
    <span class="icon">
      <i class="fab fa-github"></i>
    </span>
    <span>GitHub</span>
  </button>
  <button class="button is-medium">
    <span class="icon">
      <i class="fab fa-github"></i>
    </span>
    <span>GitHub</span>
  </button>
  <button class="button is-large">
    <span class="icon is-medium">
      <i class="fab fa-github"></i>
    </span>
    <span>GitHub</span>
  </button>
</p>

If the button only contains an icon, Bulma will make sure the button remains square, no matter the size of the button or of the icon.

<p class="buttons">
  <button class="button is-small">
    <span class="icon is-small">
      <i class="fas fa-heading"></i>
    </span>
  </button>
</p>
<p class="buttons">
  <button class="button">
    <span class="icon is-small">
      <i class="fas fa-heading"></i>
    </span>
  </button>
  <button class="button">
    <span class="icon">
      <i class="fas fa-heading fa-lg"></i>
    </span>
  </button>
</p>
<p class="buttons">
  <button class="button is-medium">
    <span class="icon is-small">
      <i class="fas fa-heading"></i>
    </span>
  </button>
  <button class="button is-medium">
    <span class="icon">
      <i class="fas fa-heading fa-lg"></i>
    </span>
  </button>
  <button class="button is-medium">
    <span class="icon is-medium">
      <i class="fas fa-heading fa-2x"></i>
    </span>
  </button>
</p>
<p class="buttons">
  <button class="button is-large">
    <span class="icon is-small">
      <i class="fas fa-heading"></i>
    </span>
  </button>
  <button class="button is-large">
    <span class="icon">
      <i class="fas fa-heading fa-lg"></i>
    </span>
  </button>
  <button class="button is-large">
    <span class="icon is-medium">
      <i class="fas fa-heading fa-2x"></i>
    </span>
  </button>
</p>

Button group
#

If you want to group buttons together on a single line, use the is-grouped modifier on the field container:

Example

HTML

<div class="field is-grouped">
  <p class="control">
    <button class="button is-link">Save changes</button>
  </p>
  <p class="control">
    <button class="button">Cancel</button>
  </p>
  <p class="control">
    <button class="button is-danger">Delete post</button>
  </p>
</div>

Button addons
#

If you want to use buttons as addons, use the has-addons modifier on the field container:

Example

HTML

<div class="field has-addons">
  <p class="control">
    <button class="button">
      <span class="icon is-small">
        <i class="fas fa-align-left"></i>
      </span>
      <span>Left</span>
    </button>
  </p>
  <p class="control">
    <button class="button">
      <span class="icon is-small">
        <i class="fas fa-align-center"></i>
      </span>
      <span>Center</span>
    </button>
  </p>
  <p class="control">
    <button class="button">
      <span class="icon is-small">
        <i class="fas fa-align-right"></i>
      </span>
      <span>Right</span>
    </button>
  </p>
</div>

Button group with addons
#

You can group together addons as well:

Example

HTML

<div class="field has-addons">
  <p class="control">
    <button class="button">
      <span class="icon is-small">
        <i class="fas fa-bold"></i>
      </span>
      <span>Bold</span>
    </button>
  </p>
  <p class="control">
    <button class="button">
      <span class="icon is-small">
        <i class="fas fa-italic"></i>
      </span>
      <span>Italic</span>
    </button>
  </p>
  <p class="control">
    <button class="button">
      <span class="icon is-small">
        <i class="fas fa-underline"></i>
      </span>
      <span>Underline</span>
    </button>
  </p>
</div>

<div class="field has-addons">
  <p class="control">
    <button class="button">
      <span class="icon is-small">
        <i class="fas fa-align-left"></i>
      </span>
      <span>Left</span>
    </button>
  </p>
  <p class="control">
    <button class="button">
      <span class="icon is-small">
        <i class="fas fa-align-center"></i>
      </span>
      <span>Center</span>
    </button>
  </p>
  <p class="control">
    <button class="button">
      <span class="icon is-small">
        <i class="fas fa-align-right"></i>
      </span>
      <span>Right</span>
    </button>
  </p>
</div>

List of buttons
#

You can create a list of buttons by using the buttons container.

<div class="buttons">
  <button class="button is-success">Save changes</button>
  <button class="button is-info">Save and continue</button>
  <button class="button is-danger">Cancel</button>
</div>

If the list is very long, it will automatically wrap on multiple lines, while keeping all buttons evenly spaced.

<div class="buttons">
  <button class="button">One</button>
  <button class="button">Two</button>
  <button class="button">Three</button>
  <button class="button">Four</button>
  <button class="button">Five</button>
  <button class="button">Six</button>
  <button class="button">Seven</button>
  <button class="button">Eight</button>
  <button class="button">Nine</button>
  <button class="button">Ten</button>
  <button class="button">Eleven</button>
  <button class="button">Twelve</button>
  <button class="button">Thirteen</button>
  <button class="button">Fourteen</button>
  <button class="button">Fifteen</button>
  <button class="button">Sixteen</button>
  <button class="button">Seventeen</button>
  <button class="button">Eighteen</button>
  <button class="button">Nineteen</button>
  <button class="button">Twenty</button>
</div>

You can attach buttons together with the has-addons modifier.

<div class="buttons has-addons">
  <button class="button">Yes</button>
  <button class="button">Maybe</button>
  <button class="button">No</button>
</div>

Use the is-centered or the is-right modifiers to alter the alignment.

<div class="buttons has-addons is-centered">
  <button class="button">Yes</button>
  <button class="button">Maybe</button>
  <button class="button">No</button>
</div>

<div class="buttons has-addons is-right">
  <button class="button">Yes</button>
  <button class="button">Maybe</button>
  <button class="button">No</button>
</div>

You can use any modifier class on each button to differentiate them. Make sure to add the is-selected modifier as well to make sure the selected button is above its siblings.

<div class="buttons has-addons">
  <button class="button is-success is-selected">Yes</button>
  <button class="button">Maybe</button>
  <button class="button">No</button>
</div>

<div class="buttons has-addons">
  <button class="button">Yes</button>
  <button class="button is-info is-selected">Maybe</button>
  <button class="button">No</button>
</div>

<div class="buttons has-addons">
  <button class="button">Yes</button>
  <button class="button">Maybe</button>
  <button class="button is-danger is-selected">No</button>
</div>

Difference between form groups and list of buttons

While this list of buttons style can be achieved with either field is-grouped or the new buttons class, there are a few differences:

    buttons has a simpler markup
    buttons can only contain button elements
    field is-grouped can contain any type of control inputs
    field is-grouped can be forced to fit all controls on a single line
    with field is-grouped you can expand one of the controls

Basically, if you only want a list of buttons, using buttons is recommended. If you need more control on the styling and the elements, use a form group.
Sass and CSS variables
#
Sass Variable
	
CSS Variable
	
Value

$button-weight

var(--bulma-button-weight)

var(--bulma-weight-medium)

$button-family

var(--bulma-button-family)

false

$button-border-color

var(--bulma-button-border-color)

var(--bulma-border)

$button-border-style

var(--bulma-button-border-style)

solid

$button-border-width

var(--bulma-button-border-width)

var(--bulma-control-border-width)

$button-padding-vertical

var(--bulma-button-padding-vertical)

0.5em

$button-padding-horizontal

var(--bulma-button-padding-horizontal)

1em

$button-focus-border-color

var(--bulma-button-focus-border-color)

var(--bulma-link-focus-border)

$button-focus-box-shadow-size

var(--bulma-button-focus-box-shadow-size)

0 0 0 0.125em

$button-focus-box-shadow-color

var(--bulma-button-focus-box-shadow-color)

hsla(
  var(--bulma-link-h),
  var(--bulma-link-s),
  var(--bulma-link-on-scheme-l),
  0.25
)

$button-active-color

var(--bulma-button-active-color)

var(--bulma-link-active)

$button-active-border-color

var(--bulma-button-active-border-color)

var(--bulma-link-active-border)

$button-text-color

var(--bulma-button-text-color)

var(--bulma-text)

$button-text-decoration

var(--bulma-button-text-decoration)

underline

$button-text-hover-background-color

var(--bulma-button-text-hover-background-color)

var(--bulma-background)

$button-text-hover-color

var(--bulma-button-text-hover-color)

var(--bulma-text-strong)

$button-ghost-background

var(--bulma-button-ghost-background)

none

$button-ghost-border-color

var(--bulma-button-ghost-border-color)

transparent

$button-ghost-color

var(--bulma-button-ghost-color)

var(--bulma-link-text)

$button-ghost-decoration

var(--bulma-button-ghost-decoration)

none

$button-ghost-hover-color

var(--bulma-button-ghost-hover-color)

var(--bulma-link)

$button-ghost-hover-decoration

var(--bulma-button-ghost-hover-decoration)

underline

$button-disabled-background-color

var(--bulma-button-disabled-background-color)

var(--bulma-scheme-main)

$button-disabled-border-color

var(--bulma-button-disabled-border-color)

var(--bulma-border)

$button-disabled-shadow

var(--bulma-button-disabled-shadow)

none

$button-disabled-opacity

var(--bulma-button-disabled-opacity)

0.5

$button-static-color

var(--bulma-button-static-color)

var(--bulma-text-weak)

$button-static-background-color

var(--bulma-button-static-background-color)

var(--bulma-scheme-main-ter)

$button-static-border-color

var(--bulma-button-static-border-color)

var(--bulma-border)



Box

A white box to contain other elements
CSS Masterclass

The box element is a simple container with a white background, some padding, and a box shadow.

Example
I'm in a box.

HTML

<div class="box">I'm in a box.</div>

Because it acts as a container, you can easily include other components, like form elements:

Example
Email
Password

HTML

<form class="box">
  <div class="field">
    <label class="label">Email</label>
    <div class="control">
      <input class="input" type="email" placeholder="e.g. alex@example.com" />
    </div>
  </div>

  <div class="field">
    <label class="label">Password</label>
    <div class="control">
      <input class="input" type="password" placeholder="********" />
    </div>
  </div>

  <button class="button is-primary">Sign in</button>
</form>

Or a media object:

Example
Image

John Smith @johnsmith 31m
Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aenean efficitur sit amet massa fringilla egestas. Nullam condimentum luctus turpis.

HTML

<div class="box">
  <article class="media">
    <div class="media-left">
      <figure class="image is-64x64">
        <img src="https://bulma.io/assets/images/placeholders/128x128.png" alt="Image" />
      </figure>
    </div>
    <div class="media-content">
      <div class="content">
        <p>
          <strong>John Smith</strong> <small>@johnsmith</small>
          <small>31m</small>
          <br />
          Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aenean
          efficitur sit amet massa fringilla egestas. Nullam condimentum luctus
          turpis.
        </p>
      </div>
      <nav class="level is-mobile">
        <div class="level-left">
          <a class="level-item" aria-label="reply">
            <span class="icon is-small">
              <i class="fas fa-reply" aria-hidden="true"></i>
            </span>
          </a>
          <a class="level-item" aria-label="retweet">
            <span class="icon is-small">
              <i class="fas fa-retweet" aria-hidden="true"></i>
            </span>
          </a>
          <a class="level-item" aria-label="like">
            <span class="icon is-small">
              <i class="fas fa-heart" aria-hidden="true"></i>
            </span>
          </a>
        </div>
      </nav>
    </div>
  </article>
</div>

Sass and CSS variables
#
Sass Variable
	
CSS Variable
	
Value

$box-background-color

var(--bulma-box-background-color)

var(--bulma-scheme-main)

$box-color

var(--bulma-box-color)

var(--bulma-text)

$box-radius

var(--bulma-box-radius)

var(--bulma-radius-large)

$box-shadow

var(--bulma-box-shadow)

var(--bulma-shadow)

$box-padding

var(--bulma-box-padding)

1.25rem

$box-link-hover-shadow

var(--bulma-box-link-hover-shadow)

0 0.5em 1em -0.125em hsla(
  var(--bulma-scheme-h),
  var(--bulma-scheme-s),
  var(--bulma-scheme-invert-l),
  0.1
),
0 0 0 1px var(--bulma-link)

$box-link-active-shadow

var(--bulma-box-link-active-shadow)

inset 0 1px 2px hsla(
  var(--bulma-scheme-h),
  var(--bulma-scheme-s),
  var(--bulma-scheme-invert-l),
  0.2
),
0 0 0 1px var(--bulma-link)



Block

Bulma’s most basic spacer block
CSS Masterclass

The block element is a simple spacer tool. It allows sibling HTML elements to have a consistent margin between them:

Example
This text is within a block.
This text is within a second block. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aenean efficitur sit amet massa fringilla egestas. Nullam condimentum luctus turpis.
This text is within a third block. This block has no margin at the bottom.

HTML

<div class="block">
  This text is within a <strong>block</strong>.
</div>
<div class="block">
  This text is within a <strong>second block</strong>. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aenean efficitur sit amet massa fringilla egestas. Nullam condimentum luctus turpis.
</div>
<div class="block">
  This text is within a <strong>third block</strong>. This block has no margin at the bottom.
</div>

As you can see, the first two blocks have a margin-bottom applied, but not the third .. That is because Bulma applies a space on all blocks, except the last one. This means you can use as many blocks as you want, the spacing will only appear between them.

Without using block, the HTML elements would have no space between them:

Example
This text is not within a block.
This text isn't within a block either. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aenean efficitur sit amet massa fringilla egestas. Nullam condimentum luctus turpis.
This text is also not within a block.

HTML

<div>
  This text is <em>not</em> within a <strong>block</strong>.
</div>
<div>
  This text <em>isn't</em> within a <strong>block</strong> either. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aenean efficitur sit amet massa fringilla egestas. Nullam condimentum luctus turpis.
</div>
<div>
  This text is also <em>not</em> within a <strong>block</strong>.
</div>

You're already using it
#

As a matter of fact, you're already using the block without knowing it. Its CSS properties are shared across several Bulma elements and components:

    breadcrumb
    level
    message
    pagination
    tabs
    box
    content
    notification
    other
    progress
    table
    title

This is thanks to the @extend %block Sass placeholder feature.

Here's how it would look like in comparison:

Without block
30%
Primar lorem ipsum dolor sit amet, consectetur adipiscing elit lorem ipsum dolor.

Error
Lorem ipsum dolor sit amet, consectetur adipiscing elit. Pellentesque risus mi, tempus quis placerat ut, porta nec nulla. Vestibulum rhoncus ac ex sit amet fringilla. Nullam gravida purus diam, et dictum felis venenatis efficitur.

With block
30%
Primar lorem ipsum dolor sit amet, consectetur adipiscing elit lorem ipsum dolor.

Error
Lorem ipsum dolor sit amet, consectetur adipiscing elit. Pellentesque risus mi, tempus quis placerat ut, porta nec nulla. Vestibulum rhoncus ac ex sit amet fringilla. Nullam gravida purus diam, et dictum felis venenatis efficitur.

No matter which Bulma elements and components you are using, and no matter their order, they will have a consistent space between them.
One line of CSS
#

As you can see, the CSS of the block is very simple: it applies a margin-bottom on all siblings, except the last one.

.block:not(:last-child) {
  margin-bottom: 1.5rem;
}

This prevents the last sibling from adding unnecessary space at the bottom.
Sass and CSS variables
#
CSS Variable
	
Value

var(--bulma-block-spacing)

1.5rem