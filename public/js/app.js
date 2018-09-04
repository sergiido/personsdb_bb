window.onload = function(){

    window.App = {
        Views: {},
        Models: {},
        Collections : {},
        Router: {},
        users: null,
        usersView: null,
        groups: null,
        groupsView: null
    };

    App.Models.User = Backbone.Model.extend({
        idAttribute: '_id',
        defaults: function(){
            return {
                name: null,
                secondname: null,
                gender: null,
                age: null,
                groupid: null,
                email: null,
                // login: null,
                role: null,
                ava: null,
                created: new Date(),
                lastlogin: null,
                active: true }
        },
        url: function() {
            return '/user/'+ this.get('_id');
        },
        validate: function (attrs) {
            // console.log(attrs);
            if ( (! attrs.name)||(attrs.name == "") ) {
                return 'empty model -name-';
            }
            if ( (! attrs.email)||(attrs.email == "") ) {
                return 'empty model -email-';
            }
        }
    });

    App.Collections.Users = Backbone.Collection.extend({
        model: App.Models.User,
        // url: '/users',
        url: function() {
            return 'group/' + this.groupid + '/users';
        },
        initialize: function(options) {
            this.groupid = options.groupId;
            // console.log('Users collection initialized', this.models);
            this.on('add', function(item) {
                // console.log('added a model to collection: ' + item.get('name') );
            });
        }
    });

    App.Views.User = Backbone.View.extend({
        tagName: 'div',
        className: 'user_block',
        template: _.template($('#user-template').html()),
        initialize: function() {
            this.render();
        },
        render: function() {
            this.$el.addClass(this.model.attributes.gender);
            this.$el.html( this.template(this.model.attributes) );
            // console.log(this.el);
            return this;
        },
        events: {
            "click button.delete": "deleteUser",
            "click button.active": "toggleActive",
            "mouseenter": "mouseEnter",
            "mouseleave": "mouseLeave",
            "click button.edit": "editUser"
        },
        deleteUser: function(e) {
            e.stopPropagation();
            console.log("model: " + this.model.get('_id') + " deleted");
            this.model.destroy({
                success: function(model, res){
                    console.log(model);
                }
            });
        },
        toggleActive: function(e) {
            e.stopPropagation(); //disable editUser
            this.model.save({active: !this.model.attributes.active});
            // console.log(!this.model.attributes.active);
        },
        editUser: function(e) {
            // console.log(e.target);
            console.log("model: " + this.model.get('_id') + " in edit mode");
        },
        mouseEnter: function() {
            this.$el.find('.actionBtns').css('opacity','1');
        },
        mouseLeave: function() {
            this.$el.find('.actionBtns').css('opacity','0.5');
        }
    });


    App.Views.Users = Backbone.View.extend({
        el: '#wrapper-users>#users-list',
        initialize: function() {
            this.listenTo(this.collection, "remove", this.removeModel);
            this.listenTo(this.collection, "change", this.changeModel);
            this.listenTo(this.collection, "reset", this.handleReset);
        },
        render: function() {

            // console.log(App.groups.get(this.collection.groupid));
            let groupname = App.groups.get(this.collection.groupid).attributes.name;
            // console.log(this.collection.groupid);
            $('#wrapper-users>span').html(" &#xf2c3; Users of: " + groupname);
            $('#wrapper-users>a').attr("href", "#tojson/"+this.collection.groupid);

            this.$el.empty();
            this.collection.each(function(user){
                // console.log(user.attributes._id);
                this.addModel(user);
            }, this);
            return this;
        },
        handleReset: function() {
            // console.log("reset " + JSON.stringify(this.collection));
            this.render();

            [].forEach.call(document.querySelectorAll('img[data-src]'), function(img) {
              img.setAttribute('src', img.getAttribute('data-src'));
              img.onload = function() {
                img.removeAttribute('data-src');
              };
            });
        },
        addModel: function(user) {
            var userView = new App.Views.User({ model: user });
            this.$el.append(userView.render().el);
        },
        removeModel: function(user) {
            // console.log(user.id);
            // this.collection.remove(user);
            this.render();
        },
        changeModel: function(user) {
            // console.log(user.id);
            this.render();
        }
    });


    App.Models.Group = Backbone.Model.extend({
        defaults: function(){
            return {
                // id: App.groups.length + 1,
                name: "$name",
                current: false,
                active: false,
                numOfUsers: 0
            }
        },
        urlRoot: function() {
            return '/group'; // /'+ this.get('id');
        },
        validate: function (attrs) {
            // console.log(attrs);
            if ( (! attrs.name)||(attrs.name == "") ) {
                return 'empty model name';
            }
        }
    });


    App.Views.Group = Backbone.View.extend({
        tagName: 'div',
        className: 'group_block',
        template: _.template($('#group-template').html()),
        initialize: function() {
            //this.render();
        },
        events : {
            'click span.action_edit' : 'editGroupName',
            'click span.action_delete' : 'deleteGroup',
            "blur div>a>span": "endEdit",
            'click span.action_active' : 'toggleActive',
            'click span.action_current' : 'setCurrent',
            'click' : 'selectGroup'
        },
        attributes: function() {
            // return {
            //     'data-id': this.model.attributes._id
            // }
        },
        render: function() {
            this.$el.html( this.template(this.model.attributes) );
            return this;
        },
        selectGroup: function(e) {
            this.$el.parent().children().removeClass('selected');
            // console.log(this.$el.parent().children());
            this.$el.addClass('selected');
            // console.log("group model: " + this.model.get('_id'));
            var groupname = $(e.currentTarget).find('a>span').html();
            $('#wrapper-users>span').html(" &#xf2c3; Users of: " + groupname);
            $('#wrapper-users>a').attr("href", "#tojson/"+this.model.get('_id'));
        },
        editGroupName: function(e) {
            e.stopPropagation();
            this.$el.children().eq(0).children().eq(1).children().eq(0).children().eq(0).attr('contenteditable','true');
            this.$el.children().eq(0).children().eq(1).children().eq(0).children().eq(0).css('color','gold');
            this.$el.children().eq(0).children().eq(1).children().eq(0).children().eq(0).focus();
        },
        endEdit: function() {
            this.$el.children().eq(0).children().eq(1).children().eq(0).children().eq(0).attr('contenteditable','false');
            this.$el.children().eq(0).children().eq(1).children().eq(0).children().eq(0).css('color','#428bca');
            // console.log(this.$el.children().eq(0).children().eq(1).children().eq(0).children().eq(0).text());
            this.model.set({name: this.$el.children().eq(0).children().eq(1).children().eq(0).children().eq(0).text().trim()});
            //console.log(this.model);
            this.model.save();
        },
        setCurrent: function(e) {
            // e.stopPropagation();
            console.log("group model: " + this.model.get('name'));
            console.log(this.model.attributes.current);
        },        
        toggleActive: function(e) {
            // e.stopPropagation();
            console.log("group model: " + this.model.get('name'));
            console.log(this.model.attributes.active);
            this.model.save({active: !this.model.attributes.active});
        },        
        deleteGroup: function(e) {
            e.stopPropagation();
            console.log("group model: " + this.model.get('_id') + " deleting");
            this.model.destroy();
        }
    });

    App.Collections.Groups = Backbone.Collection.extend({
        model: App.Models.Group,
        url: '/groups'
    });


    App.Views.Groups = Backbone.View.extend({
        el: '#wrapper-groups-list',
        initialize: function() {
            // this.counter = 0;
            this.listenTo(this.collection, "add", this.addModel);
            this.listenTo(this.collection, "remove", this.removeModel);
            this.listenTo(this.collection, "change", this.changeModel);
            this.collection.fetch({
                success: function () {
                    App.groupsView.render();
                }
            });
        },
        // events : {
        //     'click .group_block' : 'loadUsers'
        // },
        render: function() {
            this.$el.empty();
            this.collection.each(function(group){
                this.addModel(group);
            }, this);
            return this;
        },
        addModel: function(group) {
            // this.counter++;
            // console.log(this.counter);
            var groupView = new App.Views.Group({ model: group });
            this.$el.append(groupView.render().el);
        },
        loadUsers: function(e) {
            var groupname = $(e.currentTarget).find('a>span').html();
            $('#wrapper-users>span').html(" &#xf2c3; Users of: " + groupname);

            // var modelid = event.currentTarget.attributes[0].value;
            // console.log(this.collection);
                // console.log(this.collection.findWhere({'_id': modelid}) );
            // App.usersView = new App.Views.Users({collection: new App.Collections.Users()});          
        },
        changeModel: function(group) {
            // console.log(group.id);
            this.render();
        },        
        removeModel: function(group) {
            // console.log(group.id);
            this.collection.remove(group);
            this.render();
        }
    });

    App.Views.AddNewGroup = Backbone.View.extend({
        el: '#addNewGroup',
        events: {
            'submit': 'submit'
        },
        submit: function(e) {
            e.preventDefault();
            var newGroup = new App.Models.Group ({
                name: (this.$el.find('#newgroup').val()).trim(),
            });
            newGroup.save({}, {
                success: function(group) {
                    // console.log(group.changed.ops[0].id);
                    App.groupsView = new App.Views.Groups({collection: App.groups });
                }
            });
        }
    });

    // Create Router
    App.Router = Backbone.Router.extend({
        routes: {
            // ''              : 'home',
            'group/:id/users'  : 'getGroupUsers',
            'tojson/:id'      : 'toJson'
        },
        initialize: function () {
            console.log('router initialized');
            App.groups = new App.Collections.Groups();
            App.groupsView = new App.Views.Groups({collection: App.groups });
            var addNewGroupView = new App.Views.AddNewGroup;
        },
        home: function() {
            console.log('on home');
            // App.groupsView = new App.Views.Groups({collection: new App.Collections.Groups()});

        },
        getGroupUsers: function(id) {
            // App.groupsView = new App.Views.Groups({collection: new App.Collections.Groups()});
            // App.groupsView.render();

            // console.log('getGroupUsers: ' + id);
            App.users = new App.Collections.Users({groupId: id});

            App.users.fetch({reset: true});
            /*App.users.fetch({
                success: function (collection) {
                    App.usersView.filterByGroup(id);
                }
            });*/
            App.usersView = new App.Views.Users({collection: App.users });
        },
        toJson: function(id) {
            $('#users-list').text(JSON.stringify(App.users));
            // console.log(JSON.stringify(App.users.models[0].attributes));
        }
    });

    new App.Router();
    Backbone.history.start();

    // Backbone.sync = function(method, model) {
    //   console.log(method + ": " + model.url);
    // };

}
