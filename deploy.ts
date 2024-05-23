import fs from "fs"
import simpleGit from "simple-git"
import path from "path"

import { createClient } from "@supabase/supabase-js"
import dotenv from "dotenv"

// Load environment variables from .env file
dotenv.config()

const git = simpleGit()

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!)

interface BroadcastPayload {
  event: string
  type: string
  payload: Payload
}

interface Payload {
  code?: string
  path: string
  commitMsg?: string
}

const handleCreateFile = async ({ code, path: filePath }: Payload) => {
  if (!code || !filePath) return console.log("Invalid payload")

  const ensureFolderPath = filePath.split("/").slice(0, -1).join("/")
  handleCreateFolder({ path: ensureFolderPath })
  try {
    const finalPath = path.join(__dirname, filePath)
    fs.writeFileSync(finalPath, code, "utf8")
  } catch (error) {
    console.error("Failed to create file:", error)
  }
}

const handleDeleteFile = async ({ path: filePath }: Payload) => {
  if (!filePath) return console.log("Invalid payload")

  const finalPath = path.join(__dirname, filePath)

  if (fs.existsSync(finalPath)) fs.unlinkSync(finalPath)
  else console.log("File does not exist:", finalPath)
}

const handlePushFile = async ({ path: filePath, commitMsg = "Add Changes" }: Payload) => {
  if (!filePath) return console.log("Invalid payload")

  const finalPath = path.join(__dirname, filePath)
  try {
    await git.add(finalPath)
    await git.commit(commitMsg)
    await git.push("origin", "main") // Ensure 'main' is the correct branch
    console.log("File updated and pushed to GitHub successfully!")
  } catch (error) {
    console.error("Failed to push file update to GitHub:", error)
  }
}

const handleGetFile = async ({ path: filePath }: Payload) => {
  if (!filePath) return console.log("Invalid payload")

  const finalPath = path.join(__dirname, filePath)
  if (fs.existsSync(finalPath)) {
    const code = fs.readFileSync(finalPath, "utf8")
    channel.send({ event: "return-file", type: "broadcast", payload: { code, path: filePath } })
  }
}

const handleCreateFolder = async ({ path: folderPath }: Payload) => {
  if (!folderPath) return console.log("Invalid payload")

  const finalPath = path.join(__dirname, folderPath)
  if (!fs.existsSync(finalPath)) {
    fs.mkdirSync(finalPath, { recursive: true })
    console.log(`Folder created at: ${finalPath}`)
  } else {
    console.log("Folder already exists:", finalPath)
  }
}

function getAllFiles(dirPath: string, arrayOfFiles: string[] = []): string[] {
  const files = fs.readdirSync(dirPath)

  files.forEach((file) => {
    const filePath = path.join(dirPath, file)

    // Ignore node_modules and .git folders
    if (file === "node_modules" || file === ".git") {
      return
    }

    if (fs.statSync(filePath).isDirectory()) {
      arrayOfFiles = getAllFiles(filePath, arrayOfFiles)
    } else {
      arrayOfFiles.push(path.relative(__dirname, filePath))
    }
  })

  return arrayOfFiles
}

const handleGetAllFilePaths = async () => {
  const rootDir = path.resolve(__dirname) // Get the absolute path of the root directory
  const allFiles = getAllFiles(rootDir)
  channel.send({ event: "return-all-files", type: "broadcast", payload: { files: allFiles } })
}

const handleBroadcast = async ({ payload, event }: BroadcastPayload) => {
  console.log({ payload, event })
  switch (event) {
    case "create-file":
      return handleCreateFile(payload)
    case "delete-file":
      return handleDeleteFile(payload)
    case "push-file":
      return handlePushFile(payload)
    case "get-file":
      return handleGetFile(payload)
    case "get-all-files":
      return handleGetAllFilePaths()
    default:
      console.log("Invalid event:", event)
  }
}

const channel = supabase.channel("arya")

channel.on("broadcast", { event: "*" }, handleBroadcast).subscribe()

process.stdin.resume() // Keep process alive
