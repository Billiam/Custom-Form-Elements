/*
Custom Form Elements v0.11b

http://github.com/karbassi/Custom-Form-Elements

Written by Ali Karbassi (karbassi.com)

Requires jQuery v1.4.2+

Note:
    - Call once your document is loaded.
    - The sprite order from top to bottom is: unchecked, unchecked-clicked, checked, checked-clicked.
    - 'checkboxHeight' and 'radioHeight' should all be set to 1/4th the sprite height.
    - 'selectWidth' is the width of the select box image.
    - Remember that 'select' elements cannot be 'readonly'; they can be 'disabled' though.
    - The 'input' file should not be wrapped with the 'label' tag.

Example:

    jQuery(document).ready(function($) {

        // Extremely minimum version:
        // Default settings apply. All input/select tags with a class of 'styled' are affected.
        var cf = new CustomFormElements();

        // Minimum version:
        var cf = new CustomFormElements({
            checkboxHeight: 12,
            radioHeight: 11,
            selectWidth: 161,
            fileWidth: 161
        });

        // All options
        var cf = new CustomFormElements({
            styled: 'styled',
            uniqueClassName: 'customFormElement',
            checkboxHeight: 12,
            radioHeight: 11,
            selectWidth: 161,
            fileWidth: 161
        });

        // If you need to reinitialize dynamically added form elements:
        cf.repaint();

    });

*/

(function(window, document, $) {

    function CustomFormElements(options) {
        this.init.call(this, options);
    }

    CustomFormElements.prototype = {
        init: function(options) {
            // Merge options
            this.options = $.extend({}, CustomFormElements.options, options || {});
            var css = '<style>'
                    + 'input.' + this.options.styled + '{display:none;}'
                    + 'select.' + this.options.styled + '{position:relative;width:' + this.options.selectWidth + 'px;opacity:0;filter:alpha(opacity=0);z-index:5;}'
                    + 'input.' + this.options.styled + '[type=file]{display:block;position:relative;width:' + this.options.fileWidth + 'px;opacity:0;filter:alpha(opacity=0);z-index:5;}'
                    + '.disabled,.readonly{opacity:0.5;filter:alpha(opacity=50);}'
                    + '</style>'
            ;

            $(css).appendTo('head');

            this.repaint();
        },

        repaint: function(){
            var self = this;
            $('input.' + self.options.styled + '[type=checkbox],input.' + self.options.styled + '[type=radio],input.' + self.options.styled + '[type=file],select.' + self.options.styled).each(function(){

                var $this = $(this);                
                if ($this.data('_cf')) {
                    $this.data('_cf').remove();
                }

                var selected = $this.find('option:selected').text(),
                    type = this.type === 'select-one' ? 'select' : this.type,
                    isStatic = this.type === 'select-one' || this.type === 'file',
                    style = !isStatic ? ' style="background-position:0 -' + self.options[this.type + 'Height'] * (this.checked ? 2 : 0) + 'px;" ' : '',
                    isDisabled = this.disabled ? 'disabled' : '',
                    isReadonly = this.getAttribute('readonly') ? 'readonly' : '',
                    className = (self.options.uniqueClassName + ' ' + type + ' ' + isDisabled + ' ' + isReadonly + ' ').replace(/^(\s|\u00A0)+|(\s|\u00A0)+$/g, ''),
                    $span = $('<span id="' + this.id + '_cf" class="' + className + '"' + style + '>' + selected + '</span>');
                
                $this.data('_cf', $span); 
                $span.data('element', $this);
                
                $this.before($span);
            });

            self.bind();
        },

        bind: function(){
            var self = this;

            $('span.' + self.options.uniqueClassName + '.checkbox:not(.disabled,.readonly),span.' + self.options.uniqueClassName + '.radio:not(.disabled,.readonly)')
                .die('mousedown mouseup')
                .live('mousedown', function(e) {
                    self.mousedown(e, this);
                })
                .live('mouseup', function(e) {
                    self.mouseup(e, this);
                });

            var query = 'span.' + self.options.uniqueClassName + '.select:not(.disabled)+select';

            $(query).each(function(){
                $(this)
                    .parent()
                    .undelegate(query, 'change')
                    .delegate(query, 'change', function(){
                        $(this)
                            .prev('span')
                            .html(
                                $(this)
                                .find('option:selected')
                                .text()
                                .replace(/\s/g, '&nbsp;')
                            );
                    });
            });

            // Handle label clicks
            query = 'input.' + self.options.styled;
            $(query).each(function(){
                var $this = $(this);        
                var $span = $this.data('_cf');
                if ($span.is('.disabled')) {
                    return;
                }

                $(this)
                    .parent()
                    .undelegate(query, 'change')
                    .delegate(query, 'change', function(e){
                        self.reset();
                    });

                var $label = $this.closest('label');
        
                if ( ! $label.length) {
                    $label = $('label[for=' + this.id + ']');
                }
                
                $this.data('label', $label);
                $span.data('label', $label);
        
                if ($label.length) {
                    $label.data('element', $this);
                    $label.toggleClass('selected', this.checked);
                    if ($.browser.msie && $.browser.version < 9) {
                        $label.bind('click', function(){
                            var mouseup = jQuery.Event('mouseup');
                            mouseup.which = 1;
                            $(this).data('element').data('_cf').trigger(mouseup);
                        });
                    }
                }
            });
        },

        reset: function(){
            var self = this;
            $('input.' + self.options.styled).each(function(k, v) {
                var $this = $(this);
                $this.data('_cf').css('backgroundPosition', (!this.checked) ? '' : "0 -" + self.options[this.type + 'Height'] * 2 + 'px');
                if ($this.data('label')) {
                    $this.data('label').toggleClass('selected', this.checked);
                }
            });
        },

        mousedown: function(e, el) {
            if (e.which !== 1) { return; } // Only respond to left mouse clicks

            var self = this,
                $el = $(el),
                input = $el.data('element').get(0),
                offset = self.options[input.type + 'Height'] * (input.checked ? 3 : 1);
       
                $el.css('backgroundPosition', '0 -' + offset + 'px')
                   .data('label')
                   .toggleClass('selected', input.checked);
        },

        mouseup: function(e, el) {
            if (e.which !== 1) { return; } // Only respond to left mouse clicks
        
            var self = this,
                $el = $(el),
                input = $el.data('element').get(0);

            $el.css('backgroundPosition', (input.checked && input.type === 'checkbox') ? '' : "0 -" + self.options[input.type + 'Height'] * 2 + 'px');
            $el.data('label').toggleClass('selected', input.checked);
            
            if (input.type == 'radio' && input.checked === true) {
                // Prevent unselecting radio option
                return;
            }

            $('input[type=radio][name=' + input.name + ']', $(input).parents('form:first')).not(input).each(function(){
                var $this = $(this);
                $this.data('_cf').css('backgroundPosition', '');
                $this.data('label').removeClass('selected');
            });

            input.checked = !input.checked;
            $(input).trigger('change');
        }

    };

    // Default CustomFormElements options
    CustomFormElements.options = {
        styled: 'styled',
        uniqueClassName: 'customFormElement',
        checkboxHeight: 12,
        radioHeight: 11,
        selectWidth: 161,
        fileWidth: 161
    };

    // Expose CustomFormElements to the global object
    window.CustomFormElements = CustomFormElements;
})(window, document, jQuery);
