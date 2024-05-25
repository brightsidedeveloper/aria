import { cyan, magenta } from 'colorette'

export const logAriaGPT = () => {
  console.log(
    magenta(`
                    █████╗ ██████╗ ██╗ █████╗
                   ██╔══██╗██╔══██╗██║██╔══██╗
                   ███████║██████╔╝██║███████║
                   ██╔══██║██╔══██╗██║██╔══██║
                   ██║  ██║██   ██╝██║██║  ██║
                   ╚═╝  ╚═╝╚╝   ╚╝ ╚═╝╚═╝  ╚═╝
    `)
  )
  console.log(
    cyan(`
      ******************************************************
      *                                                    *
      *      Aria-GPT: Your Ultimate AI Developer!         *
      *      Writing flawless code on your machine.        *
      *                                                    *
      ******************************************************
  
    `)
  )
}
