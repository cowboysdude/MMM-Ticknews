

            var oneliner = $('.MMM-Ticknews .oneliner .newsticker').newsTicker({
                row_height: 44,
                max_rows: 1,
                time: 5000,
                nextButton: $('#oneliner .header')
            });

//function tick(){
//		$('.ticker li').each(function( i ) {
//            if ( this.style.display !== "none" ) {
//              $( this ).slideUp( function () { $(this).appendTo($('.ticker')) });
//            } else {
//              $( this ).slideDown();
//              return false;
//            }
//        }); 
//	}
//	setInterval(function(){ tick () }, 5000);