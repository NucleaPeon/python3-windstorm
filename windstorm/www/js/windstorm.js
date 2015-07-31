(function($){

  var MESSAGE_TYPES = {
      'Notification': 0,
      'Warning': 1,
      'Error': 2
  }

  Backbone.sync = function(method, model, success, error){
    console.log("TODO: Sync to a source");
    success();
  }

  var User = Backbone.Model.extend({
      defaults: {
          'username': "Guest",
          'logintime': Date.now(),
          'permissions': {
              'read': false,
              'write': false,
              'execute': false
          }
      }
  });

  var Project = Backbone.Model.extend({
      defaults: {
          'name': 'foo',
          'depends': {}
      }
  });

  var TestSuite = Backbone.Model.extend({
      defaults: {
          'name': 'bar',
          'locations': [],
          'plugins': [],
          'success': function() { console.log("Success"); },
          'failure': function() { console.log("Failure"); }
      }
  });

  var Message = Backbone.Model.extend({
      defaults: {
          'message': "Hello World!",
          'type': MESSAGE_TYPES['Notification']
      }
  });

  var LogoView = Backbone.View.extend({
      tagName: 'img',
      attributes: {
          'src': "/imgs/Skyblaze-1183-TornadoCutieMark.png",
          'height': "36px",
          'width': "36px"
      },
      events: {
        "click": function() { alert("click"); }
      }
  });

  var NavigationView = Backbone.View.extend({
      tagName: 'nav',
      attributes: {
          "class": "navbar navbar-default navbar-static-top"
      },
      events: {
      },
      initialize: function() {
          _.bindAll(this, 'render');
          this.softwaremodal = new SoftwareInfoView();
          this.logo = new LogoView();
          this.render();
      },
      render: function() {
          $(this.el).append($("<div>").addClass("container-fluid")
              .append($("<div>").addClass("navbar-header")
                .append($("<a>").addClass("navbar-brand").attr("href", "#")
                    .append(this.logo.render().el)
                )
              ).append($("<div>").html("<h3><b>Python Windstorm</b> - Testing and Deployment</h3>"))
        );
        return this;
      }
  });

  var SoftwareInfoView = Backbone.View.extend({
      tagName: 'div',
      attributes: {
          "id": "SoftwareDetails",
          "class": "modal fade",
          "role": "dialog"
      },
      events: {
      },
      initialize: function() {
          _.bindAll(this, 'render');
          this.bind('change', this.render);
      },
      render: function() {
          $(this.el).append($("<div>").addClass("modal-dialog")
            .append($("<div>").addClass("modal-content")
                .append($("<div>").addClass("modal-header")
                    .append($("<span>")
                        .attr("id", "SoftwareDetailsHeader")
                        .css("font-size", "140%")
                        .html("Title")
                    )
                )
             )
          )
          return this;
      }
  });


  var PageStruct = Backbone.View.extend({
      el: $("body"),
      initialize: function() {
          _.bindAll(this, 'render');
          this.bind('change', this.render);
          this.render();
      },
      render: function() {
          // Append all major view components: navigation, main, footer
          this.navbar = new NavigationView();
          $(this.el).append(this.navbar.el);
          $(this.el).append($("<div id='main'>"));
          $(this.el).append($("<div id='footer'>"));
      }
  });
  /**
   * <nav class="navbar navbar-default navbar-static-top">
            <div class="container-fluid">
                <div class="navbar-header">
                    <button type="button" class="navbar-toggle collapsed" data-toggle="collapse" data-target="#bs-example-navbar-collapse-1">
                        <span class="sr-only">Toggle navigation</span>
                        <span class="icon-bar"></span>
                        <span class="icon-bar"></span>
                        <span class="icon-bar"></span>
                    </button>
                    <a class="navbar-brand" href="#"><img src="imgs/Skyblaze-1183-TornadoCutieMark.png" height="36px" width="36px" ></a>
                </div>
                <div class="collapse navbar-collapse" id="bs-example-navbar-collapse-1">
                    <h3><b>Python Windstorm</b> - Testing and Deployment<h3>
                </div>
            </div>
        </nav>
   *
   *
   */
  /**
  var List = Backbone.Collection.extend({
      model: Item
  });

  var ItemView = Backbone.View.extend({
    tagName: 'li',
    events: {
      'click span.swap':  'swap',
      'click span.delete': 'remove'
    },
    initialize: function(){
      _.bindAll(this, 'render', 'unrender', 'swap', 'remove'); // every function that uses 'this' as the current object should be in here
      this.model.bind('change', this.render);
      this.model.bind('remove', this.unrender);

    },
    render: function(){
      $(this.el).html('<span style="color:black;">'+this.model.get('part1')+' '+this.model.get('part2')+'</span> &nbsp; &nbsp; <span class="swap" style="font-family:sans-serif; color:blue; cursor:pointer;">[swap]</span> <span class="delete" style="cursor:pointer; color:red; font-family:sans-serif;">[delete]</span>');
      return this; // for chainable calls, like .render().el
    },

    unrender: function(){
      $(this.el).remove();
    },

    swap: function() {
      var swapped = {
        part1: this.model.get('part2'),
        part2: this.model.get('part1')
      };
      this.model.set(swapped);
    },

    remove: function(){
      this.model.destroy();
    }
  });


  var ListView = Backbone.View.extend({
    el: $("body"),
    events: {
      'click button#add': 'addItem'
    },
    initialize: function() {
      _.bindAll(this, 'render', 'addItem', 'appendItem');
      this.collection = new List();
      this.collection.bind('add', this.appendItem); // collection event binder

      this.counter = 0;
      this.render();
    },

    render: function() {
      var self = this;
      $(this.el).append("<button class='btn btn-primary' id='add'>Add list item</button>");
      $(this.el).append("<ul></ul>");
      _(this.collection.models).each(function(item){ // in case collection is not empty
        self.appendItem(item);
      }, this);
    },

    // Custom Functions, events
    addItem: function() {
      this.counter ++;
      var item = new Item();
      item.set({
          part2: item.get('part2') + this.counter
      });
      this.collection.add(item);
    },

    appendItem: function(item) {
        var itemView = new ItemView({
            model: item
        });
        $("ul", this.el).append(itemView.render().el);
    }
  });
  var listView = new ListView();
  **/
  var page = new PageStruct();
})(jQuery);