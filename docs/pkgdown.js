/* http://gregfranko.com/blog/jquery-best-practices/ */
(function($) {
  $(function() {

    $('nav.navbar').headroom();

    Toc.init({
      $nav: $("#toc"),
      $scope: $("main h2, main h3, main h4, main h5, main h6")
    });

    if ($('#toc').length) {
      $('body').scrollspy({
        target: '#toc',
        offset: $("nav.navbar").outerHeight() + 1
      });
    }

    // Activate popovers
    $('[data-bs-toggle="popover"]').popover({
      container: 'body',
      html: true,
      trigger: 'focus',
      placement: "top",
      sanitize: false,
    });

    $('[data-bs-toggle="tooltip"]').tooltip();

  /* Clipboard --------------------------*/

  function changeTooltipMessage(element, msg) {
    var tooltipOriginalTitle=element.getAttribute('data-original-title');
    element.setAttribute('data-original-title', msg);
    $(element).tooltip('show');
    element.setAttribute('data-original-title', tooltipOriginalTitle);
  }

  if(ClipboardJS.isSupported()) {
    $(document).ready(function() {
      var copyButton = "<button type='button' class='btn btn-primary btn-copy-ex' title='Copy to clipboard' aria-label='Copy to clipboard' data-toggle='tooltip' data-placement='left' data-trigger='hover' data-clipboard-copy><i class='fa fa-copy'></i></button>";

      $("div.sourceCode").addClass("hasCopyButton");

      // Insert copy buttons:
      $(copyButton).prependTo(".hasCopyButton");

      // Initialize tooltips:
      $('.btn-copy-ex').tooltip({container: 'body'});

      // Initialize clipboard:
      var clipboard = new ClipboardJS('[data-clipboard-copy]', {
        text: function(trigger) {
          return trigger.parentNode.textContent.replace(/\n#>[^\n]*/g, "");
        }
      });

      clipboard.on('success', function(e) {
        changeTooltipMessage(e.trigger, 'Copied!');
        e.clearSelection();
      });

      clipboard.on('error', function() {
        changeTooltipMessage(e.trigger,'Press Ctrl+C or Command+C to copy');
      });

    });
  }

    /* Search marking --------------------------*/
    var url = new URL(window.location.href);
    var toMark = url.searchParams.get("q");
    var mark = new Mark("main#main");
    if (toMark) {
      mark.mark(toMark, {
        accuracy: {
          value: "complementary",
          limiters: [",", ".", ":", "/"],
        }
      });
    }

  /* Search --------------------------*/
  /* Adapted from https://github.com/rstudio/bookdown/blob/2d692ba4b61f1e466c92e78fd712b0ab08c11d31/inst/resources/bs4_book/bs4_book.js#L25 */
    // Initialise search index on focus
  var fuse;
  $("#search-input").focus(async function(e) {
    if (fuse) {
      return;
    }

    $(e.target).addClass("loading");
    var response = await fetch($("#search-input").data("search-index"));
    var data = await response.json();

    var options = {
      keys: ["what", "text", "code"],
      ignoreLocation: true,
      threshold: 0.1,
      includeMatches: true,
      includeScore: true,
    };
    fuse = new Fuse(data, options);

    $(e.target).removeClass("loading");
  });

  // Use algolia autocomplete
  var options = {
    autoselect: true,
    debug: true,
    hint: false,
    minLength: 2,
  };
  var q;
async function searchFuse(query, callback) {
  await fuse;

  var items;
  if (!fuse) {
    items = [];
  } else {
    q = query;
    var results = fuse.search(query, { limit: 20 });
    items = results
      .filter((x) => x.score <= 0.75)
      .map((x) => x.item);
    if (items.length === 0) {
      items = [{dir:"Sorry 😿",previous_headings:"",title:"No results found.",what:"No results found.",path:window.location.href}];
    }
  }
  callback(items);
}
  $("#search-input").autocomplete(options, [
    {
      name: "content",
      source: searchFuse,
      templates: {
        suggestion: (s) => {
          if (s.title == s.what) {
            return `${s.dir} >	<div class="search-details"> ${s.title}</div>`;
          } else if (s.previous_headings == "") {
            return `${s.dir} >	<div class="search-details"> ${s.title}</div> > ${s.what}`;
          } else {
            return `${s.dir} >	<div class="search-details"> ${s.title}</div> > ${s.previous_headings} > ${s.what}`;
          }
        },
      },
    },
  ]).on('autocomplete:selected', function(event, s) {
    window.location.href = s.path + "?q=" + q + "#" + s.id;
  });
  });
})(window.jQuery || window.$)




/**
 * jQuery Plugin: Sticky Tabs
 *
 * @author Aidan Lister <aidan@php.net>
 * adapted by Ruben Arslan to activate parent tabs too
 * http://www.aidanlister.com/2014/03/persisting-the-tab-state-in-bootstrap/
 */
(function($) {
  "use strict";
  $.fn.rmarkdownStickyTabs = function() {
    var context = this;
    // Show the tab corresponding with the hash in the URL, or the first tab
    var showStuffFromHash = function() {
      var hash = window.location.hash;
      var selector = hash ? 'a[href="' + hash + '"]' : 'li.active > a';
      var $selector = $(selector, context);
      if($selector.data('toggle') === "tab") {
        $selector.tab('show');
        // walk up the ancestors of this element, show any hidden tabs
        $selector.parents('.section.tabset').each(function(i, elm) {
          var link = $('a[href="#' + $(elm).attr('id') + '"]');
          if(link.data('toggle') === "tab") {
            link.tab("show");
          }
        });
      }
    };


    // Set the correct tab when the page loads
    showStuffFromHash(context);

    // Set the correct tab when a user uses their back/forward button
    $(window).on('hashchange', function() {
      showStuffFromHash(context);
    });

    // Change the URL when tabs are clicked
    $('a', context).on('click', function(e) {
      history.pushState(null, null, this.href);
      showStuffFromHash(context);
    });

    return this;
  };
}(jQuery));

window.buildTabsets = function(tocID) {

  // build a tabset from a section div with the .tabset class
  function buildTabset(tabset) {

    // check for fade and pills options
    var fade = tabset.hasClass("tabset-fade");
    var pills = tabset.hasClass("tabset-pills");
    var navClass = pills ? "nav-pills" : "nav-tabs";

    // determine the heading level of the tabset and tabs
    var match = tabset.attr('class').match(/level(\d) /);
    if (match === null)
      return;
    var tabsetLevel = Number(match[1]);
    var tabLevel = tabsetLevel + 1;

    // find all subheadings immediately below
    var tabs = tabset.find("div.section.level" + tabLevel);
    if (!tabs.length)
      return;

    // create tablist and tab-content elements
    var tabList = $('<ul class="nav ' + navClass + '" role="tablist"></ul>');
    $(tabs[0]).before(tabList);
    var tabContent = $('<div class="tab-content"></div>');
    $(tabs[0]).before(tabContent);

    // build the tabset
    var activeTab = 0;
    tabs.each(function(i) {

      // get the tab div
      var tab = $(tabs[i]);

      // get the id then sanitize it for use with bootstrap tabs
      var id = tab.attr('id');

      // see if this is marked as the active tab
      if (tab.hasClass('active'))
        activeTab = i;

      // remove any table of contents entries associated with
      // this ID (since we'll be removing the heading element)
      $("div#" + tocID + " li a[href='#" + id + "']").parent().remove();

      // sanitize the id for use with bootstrap tabs
      id = id.replace(/[.\/?&!#<>]/g, '').replace(/\s/g, '_');
      tab.attr('id', id);

      // get the heading element within it, grab it's text, then remove it
      var heading = tab.find('h' + tabLevel + ':first');
      var headingText = heading.html();
      heading.remove();

      // build and append the tab list item
      var a = $('<a role="tab" data-toggle="tab">' + headingText + '</a>');
      a.attr('href', '#' + id);
      a.attr('aria-controls', id);
      var li = $('<li role="presentation"></li>');
      li.append(a);
      tabList.append(li);

      // set it's attributes
      tab.attr('role', 'tabpanel');
      tab.addClass('tab-pane');
      tab.addClass('tabbed-pane');
      if (fade)
        tab.addClass('fade');

      // move it into the tab content div
      tab.detach().appendTo(tabContent);
    });

    // set active tab
    $(tabList.children('li')[activeTab]).addClass('active');
    var active = $(tabContent.children('div.section')[activeTab]);
    active.addClass('active');
    if (fade)
      active.addClass('in');

    if (tabset.hasClass("tabset-sticky"))
      tabset.rmarkdownStickyTabs();
  }

  // convert section divs with the .tabset class to tabsets
  var tabsets = $("div.section.tabset");
  tabsets.each(function(i) {
    buildTabset($(tabsets[i]));
  });
};


