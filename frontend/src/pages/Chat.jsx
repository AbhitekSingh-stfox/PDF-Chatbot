import {useState} from 'react';
import {useDropzone} from 'react-dropzone'


function Chat(){

    const [pdfId,setPdfId] = useState("")
    const [question,setQuestion] = useState("")
    const [answer , setAnswer] = useState("")
    const [uploading , setUploading] = useState(false)
    const [chatLoading, setChatLoading] = useState(false)


    const onDrop = async (acceptedFiles) => {
        setUploading(true)

        try {

            const formData = new FormData()

            acceptedFiles.forEach((file) => {
                formData.append("files",file)
            })

            const response = await fetch("http://127.0.0.1:8000/upload",{
                method : "POST",
                body : formData
            })

            const data = await response.json()
            setPdfId(data.pdf_id)
        }

        catch (error) {
            console.error(error)
        }

        finally{
            setUploading(false)
        }
    }

    const { getRootProps , getInputProps } = useDropzone({
        onDrop,
        accept : {
            "application/pdf" : [".pdf"]
        }
    })

    const handleChatSubmit = async (e) => {
        e.preventDefault()
        setChatLoading(true)

        try{

            const response = await fetch("http://127.0.0.1:8000/chat",{
                method : "POST",
                headers: {
                    "Content-Type" : "application/json"
                },
                body: JSON.stringify({
                    pdf_id : pdfId,
                    question : question
                })
            })

            const data = await response.json()
            setAnswer(data.answer)
        } catch (error) {
            console.error(error);
        } 
        finally {
            setChatLoading(false);
        }
    }

    return (
      <div className="min-h-screen bg-zinc-950 text-white flex flex-col">

    {/* Header */}
    <div className="border-b border-white/10 backdrop-blur-xl">
      <div className="max-w-5xl mx-auto px-6 py-5">
        <h1 className="text-2xl font-semibold tracking-wide">
          PDF Chatbot
        </h1>
        <p className="text-zinc-400 text-sm mt-1">
          Upload a PDF and chat with its contents
        </p>
      </div>
    </div>

    {/* Main Area */}
    <div className="flex-1 max-w-5xl w-full mx-auto px-6 py-6 flex flex-col">

      {/* Upload Zone */}
      {!pdfId && (
        <div
          {...getRootProps()}
          className="
            border
            border-white/20
            bg-white/5
            backdrop-blur-xl
            rounded-3xl
            p-16
            text-center
            cursor-pointer
            transition
            hover:border-white/40
            hover:bg-white/10
            shadow-2xl
          "
        >
          <input {...getInputProps()} />

          <div className="space-y-3">
            <div className="text-5xl">📄</div>

            {uploading ? (
              <>
                <p className="text-lg font-medium">
                  Processing PDF...
                </p>
                <p className="text-zinc-400">
                  Summarizing and indexing document
                </p>
              </>
            ) : (
              <>
                <p className="text-xl font-medium">
                  Drop PDF here
                </p>
                <p className="text-zinc-400">
                  Click or drag your document
                </p>
              </>
            )}
          </div>
        </div>
      )}

      {/* Chat Area */}
      {pdfId && (
        <>
          {/* Status */}
          <div className="mb-6">
            <div
              className="
                inline-flex
                items-center
                gap-2
                px-4
                py-2
                rounded-full
                border
                border-white/20
                bg-white/5
              "
            >
              <span className="h-2 w-2 rounded-full bg-green-400"></span>
              PDF Ready
            </div>
          </div>

          {/* Messages */}
          <div
            className="
              flex-1
              overflow-y-auto
              space-y-6
              mb-6
              rounded-3xl
              border
              border-white/10
              bg-white/[0.03]
              backdrop-blur-xl
              p-6
              min-h-[500px]
            "
          >

            {question && (
              <div className="flex justify-end">
                <div
                  className="
                    max-w-[75%]
                    rounded-3xl
                    px-5
                    py-4
                    bg-white
                    text-black
                    shadow-lg
                  "
                >
                  {question}
                </div>
              </div>
            )}

            {answer && (
              <div className="flex justify-start">
                <div
                  className="
                    max-w-[75%]
                    rounded-3xl
                    px-5
                    py-4
                    bg-zinc-900
                    border
                    border-white/20
                    shadow-lg
                  "
                >
                  {answer}
                </div>
              </div>
            )}

            {chatLoading && (
              <div className="flex justify-start">
                <div
                  className="
                    rounded-3xl
                    px-5
                    py-4
                    bg-zinc-900
                    border
                    border-white/20
                  "
                >
                  Thinking...
                </div>
              </div>
            )}

          </div>

          {/* Input Area */}
          <form onSubmit={handleChatSubmit}>
            <div
              className="
                flex
                items-center
                gap-3
                border
                border-white/15
                bg-white/[0.04]
                backdrop-blur-xl
                rounded-3xl
                p-3
              "
            >
              <textarea
                rows="1"
                placeholder="Ask a question about the PDF..."
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                disabled={chatLoading}
                className="
                  flex-1
                  bg-transparent
                  outline-none
                  resize-none
                  text-white
                  placeholder:text-zinc-500
                  px-3
                "
              />

              <button
                type="submit"
                disabled={chatLoading}
                className="
                  px-6
                  py-3
                  rounded-2xl
                  bg-white
                  text-black
                  font-medium
                  hover:scale-105
                  transition
                  disabled:opacity-50
                "
              >
                Send
              </button>
            </div>
          </form>
        </>
      )}

    </div>
  </div>
    ) 
}

export default Chat