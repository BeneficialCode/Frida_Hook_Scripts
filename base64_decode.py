import base64
import gzip


def decrypt():
    table = ['L', 'K', 'N', 'M', 'O', 'Q', 'P', 'R', 'S', 'A', 'T', 'B', 'C', 'E', 'D', 'F', 'G', 'H', 'I', 'J', 'U', 'V', 'W', 'X', 'Y', 'Z', 'a', 'b', 'c', 'o', 'd', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'e', 'f', 'g', 'h', 'j', 'i', 'k', 'l', 'm', 'n', 'y', 'z', '0', '1', '2', '3', '4', '6', '5', '7', '8', '9', '+', '/']
    custom_b64 = ''.join(table)
    encoded = 'R4jSLLLLLLLLLLOrLE7/5B+Z6fsl65yj6BgC6YWz66gO6g2t65Pk6a+P65NK44NNROl0wNOLLLL='
    std_b64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
    encoded = encoded.translate(str.maketrans(custom_b64,std_b64))
    decompressed_data = base64.b64decode(encoded)
    flag = gzip.decompress(decompressed_data).decode()
    print(flag)
    
if __name__ == '__main__':
    decrypt()