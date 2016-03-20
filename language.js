cmndList = ['JMP', 'MOV', 'RTN', 'SHT']
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
	for (line in input) {
		var params = input[line].split(" ")
		var index = indexCommand(params[0])
		console.log(index)
		if (index != cmndList.length) {
			instructionList.push([index, parseInt(params[1])])
		} else {
			return false
		}
	}
	return true
}

function execAssembly() {
	return true
}

testScript = []
testScript.push("MOV 10")
testScript.push("RTN 90")
testScript.push("SHT")
testScript.push("JMP 1")
console.log(validateList(testScript))
console.log(instructionList)
