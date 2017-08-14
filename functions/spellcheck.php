<?php

$dictionary = 'en_US';

$speller = null;
/* Create speller object and set options */
$pspellConfig = pspell_config_create($dictionary);
pspell_config_mode($pspellConfig, 1);
$speller = pspell_new_config($pspellConfig);

/* Parse request and generate response */
$i = 0;
header("Content-type: text/javascript; charset=UTF-8");
print "data = [";
foreach($_GET as $key => $word) {
	if (!$word) { break; }
	if ($i) { print ","; }  
	if (pspell_check($speller, $word)) {
		print '[1]';
	}
	else {
		print '[0,[';
		$suggestions = pspell_suggest($speller, $word);
		if (count($suggestions) > 0) {
			print '"' . implode('","', $suggestions) . '"';
		}
		print ']]';
	}
	$i++;
};
print "];\n";

?>