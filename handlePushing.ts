import path from 'path'
import simpleGit from 'simple-git'
import { Payload, channel } from './deploy'
import { green, redBright } from 'colorette'

const git = simpleGit()

export const handlePushing = async ({ path: filePath, commitMsg = 'Add Changes' }: Payload) => {
  if (!filePath) {
    channel.send({
      event: 'push-file',
      type: 'broadcast',
      payload: { message: 'Invalid payload: Missing path' },
    })
    return
  }

  const finalPath = path.join(__dirname, filePath)
  try {
    await git.add(finalPath)
    await git.commit(commitMsg)
    await git.push('origin', 'main') // Ensure 'main' is the correct branch
    console.log(green('File updated and pushed to GitHub successfully!'))
    channel.send({
      event: 'push-file',
      type: 'broadcast',
      payload: {
        message: 'File updated and pushed to GitHub successfully!',
        path: filePath,
      },
    })
  } catch (error) {
    console.log(redBright('Failed to push file update to GitHub:'), error)
    channel.send({
      event: 'push-file',
      type: 'broadcast',
      payload: {
        message: `Failed to push file update to GitHub: You are not handling this error well. Look at line 42 of deploy`,
        path: filePath,
      },
    })
  }
}
