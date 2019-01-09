(function ($) {
    function Value() {
        var $this = this;

        function initilizeModel() {
            $("#modal-action-value").on('loaded.bs.modal', function (e) {
                
            }).on('hidden.bs.modal', function (e) {
                
                $(this).removeData('bs.modal');
            });
        }
        $this.init = function () {
            initilizeModel();
        }
    }
    $(function () {
        var self = new Value();
        self.init();
    })
}(jQuery))
