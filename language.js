cmndList = [JMP, MOV, RTN, SHT]
instructionList = []

function indexCommand(inputCmnd) {
	for (validCmnd in cmndList) {
		if (cmndList[validCmnd] == inputCmnd) {
			return validCmnd
		}
	}
	return cmndList.length
}

function validateList(input) {
	for (line in list) {
		params = input[line].split["\\t"]
		if (indexCommand(params[0]) == cmndList.length) {
			instructionList.push(params)
		} else {
			return false
		}
	}
	return true
}
